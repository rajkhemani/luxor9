#!/usr/bin/env python3
"""
Luxor9 OS — Wan 2.1 & ComfyUI Automated Video Factory (Colab / Kaggle).

Sets up ComfyUI, downloads the Wan2.1-T2V-1.3B-FP8 weights (free T4 friendly),
connects Google Drive, and headless-renders every scene in the CONFIG below —
all outputs are copied to Google Drive.

References:
    - https://github.com/Wan-Video/Wan2.1
    - https://github.com/Comfy-Org/ComfyUI

Run order: 1 → 7 in one pass (Runtime ▸ Run all in Colab, or `python3
Luxor9_Wan21_Kaggle_Automation.py` on a GPU box). Edit the CONFIG section
(below) to change scenes, resolution, steps, or output format.
"""

import json
import os
import shutil
import subprocess
import threading
import time
import urllib.request


# --------------------------------------------------------------------------- #
# 1. Check GPU & mount Google Drive for persistent storage
# --------------------------------------------------------------------------- #

def check_gpu():
    """Sanity-check the GPU. T4 (16 GB) is the free-tier default and is enough
    for Wan 2.1 T2V 1.3B fp8."""
    gpu = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
        capture_output=True, text=True,
    )
    print(gpu.stdout.strip() or gpu.stderr.strip())
    if not gpu.stdout.strip():
        raise SystemExit(
            "ERROR: nvidia-smi not found — this kernel is running WITHOUT a "
            "GPU. Enable a GPU accelerator (Runtime ▸ Change runtime type) and "
            "restart."
        )


def mount_drive():
    """Mount Google Drive and prepare the output directory (Colab only)."""
    OUTPUT_DIR = "/content/drive/MyDrive/Luxor9_Seedance2.5_Video_Campaign/renders/"
    if os.path.isdir("/content"):
        try:
            from google.colab import drive  # type: ignore
            drive.mount("/content/drive")
        except Exception:
            print("Note: not running in Colab — using local output dir instead.")
            OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders")
    else:
        OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Mounted Google Drive. Output path:", OUTPUT_DIR)
    return OUTPUT_DIR


# --------------------------------------------------------------------------- #
# 2. CONFIG — edit scenes & render settings here
# --------------------------------------------------------------------------- #

DEFAULTS = {
    "width": 1280,
    "height": 720,
    "length": 81,       # frames (~3.4s at 24 fps)
    "steps": 30,
    "cfg": 6.5,
    "fps": 24,
    "sampler_name": "euler",
    "scheduler": "simple",
    "seed": None,       # None = random per scene; set a number for reproducible renders
}

OUTPUT_FORMAT = "mp4"   # "mp4" (VideoHelperSuite) or "webp" (built-in, no extra install)

SCENES = [
    {
        "prefix": "Luxor9_Scene01",
        "prompt": (
            "Cinematic 4K shot, 24fps. Symmetrical medium tracking shot of an open sovereign terminal "
            "inside a dark technical noir observatory. Multi-agent AI nodes execute zero-latency liquidity "
            "routing across floating obsidian glass interfaces, glowing 0.5px gold velocity lines, "
            "volumetric atmospheric lighting, anamorphic lens flare, shallow depth of field."
        ),
    },
    {
        "prefix": "Luxor9_Scene02",
        "prompt": (
            "Extreme close-up macro shot of gold liquidity routing lines weaving through a floating "
            "holographic trading terminal, dark noir palette, volumetric fog, glowing particle trails, "
            "cinematic lighting, 24fps, shallow depth of field."
        ),
    },
    {
        "prefix": "Luxor9_Scene03",
        "prompt": (
            "Wide establishing shot of the sovereign terminal interior: a vast dark observatory where "
            "multi-agent AI nodes hover as points of light, obsidian glass interfaces floating in layers, "
            "anamorphic lens flare, volumetric atmospheric lighting, cinematic 24fps."
        ),
    },
]

MODEL_FILES = {
    "unet": "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_t2v_1.3B_fp8_e4m3fn.safetensors",
    "unet_name": "wan2.1_t2v_1.3B_fp8_e4m3fn.safetensors",
    "clip": "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip/umt5_xxl_fp8_e4m3fn.safetensors",
    "clip_name": "umt5_xxl_fp8_e4m3fn.safetensors",
    "vae": "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors",
    "vae_name": "wan_2.1_vae.safetensors",
}


# --------------------------------------------------------------------------- #
# 3. Clone ComfyUI & install dependencies
# --------------------------------------------------------------------------- #

def setup_comfyui():
    # NOTE: We do NOT reinstall torch — Colab's preinstalled CUDA build is used.
    if not os.path.isdir("/content/ComfyUI"):
        subprocess.run(
            ["git", "clone", "--depth", "1",
             "https://github.com/comfyanonymous/ComfyUI.git", "/content/ComfyUI"],
            check=True,
        )
    os.chdir("/content/ComfyUI")
    subprocess.run(["pip", "install", "-q", "-r", "requirements.txt"], check=True)
    subprocess.run(
        ["pip", "install", "-q", "diffusers", "transformers", "accelerate", "sentencepiece"],
        check=True,
    )


# --------------------------------------------------------------------------- #
# 4. Download Wan 2.1 T2V 1.3B weights (fp8), text encoder, and VAE
# --------------------------------------------------------------------------- #

def download_models():
    MODEL_DIR = "/content/ComfyUI/models"

    def download(url, filename, subdir):
        dest = os.path.join(MODEL_DIR, subdir, filename)
        if os.path.exists(dest):
            print("Already present:", dest)
            return
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        print("Downloading", filename, "...")
        subprocess.run(["wget", "-q", "-c", url, "-O", dest], check=True)
        print("OK:", dest)

    download(MODEL_FILES["unet"], MODEL_FILES["unet_name"], "diffusion_models")
    download(MODEL_FILES["clip"], MODEL_FILES["clip_name"], "clip")
    download(MODEL_FILES["vae"], MODEL_FILES["vae_name"], "vae")


# --------------------------------------------------------------------------- #
# 5. Install VideoHelperSuite custom node (required for MP4 output)
# --------------------------------------------------------------------------- #

def install_vhs():
    if not os.path.isdir("/content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite"):
        subprocess.run(
            ["git", "clone", "--depth", "1",
             "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git",
             "/content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite"],
            check=True,
        )
    os.chdir("/content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite")
    subprocess.run(["pip", "install", "-q", "-r", "requirements.txt"], check=True)
    os.chdir("/content/ComfyUI")


# --------------------------------------------------------------------------- #
# 6. Start ComfyUI headless + Cloudflare tunnel (readiness polling & URL capture)
# --------------------------------------------------------------------------- #

API = "http://127.0.0.1:8188"


def start_comfyui():
    comfy_proc = subprocess.Popen(
        ["python", "main.py", "--listen", "127.0.0.1", "--port", "8188"],
        cwd="/content/ComfyUI",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Poll until the API responds (first boot can take a while — no fixed sleep).
    ready = False
    for _ in range(120):
        try:
            with urllib.request.urlopen(f"{API}/system_stats", timeout=3) as resp:
                json.loads(resp.read().decode())
            ready = True
            break
        except Exception:
            time.sleep(5)

    if not ready:
        raise RuntimeError("ComfyUI did not become ready on port 8188 — check the logs.")

    print("ComfyUI ready at", API)

    # Cloudflare quick tunnel — the public WebUI URL is captured from the logs.
    if not os.path.isfile("/content/cloudflared"):
        subprocess.run(
            ["wget", "-q",
             "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
             "-O", "/content/cloudflared"],
            check=True,
        )
        os.chmod("/content/cloudflared", 0o755)

    cf_proc = subprocess.Popen(
        ["/content/cloudflared", "tunnel", "--url", API, "--no-autoupdate"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    tunnel_url = [None]

    def read_cf_logs():
        for line in cf_proc.stdout:
            line = line.strip()
            if "trycloudflare.com" in line:
                start = line.find("https://")
                tunnel_url[0] = line[start:].strip()
                print("Tunnel URL:", tunnel_url[0])
            elif "ERR" in line or "error" in line.lower():
                print(line)

    threading.Thread(target=read_cf_logs, daemon=True).start()
    time.sleep(8)
    if not tunnel_url[0]:
        print("Tunnel still starting — the URL will be printed above when ready.")
    return comfy_proc, cf_proc


# --------------------------------------------------------------------------- #
# 7. Headless batch render — every scene in CONFIG, saved to Google Drive
# --------------------------------------------------------------------------- #

COMFY_OUTPUT = "/content/ComfyUI/output"


def queue_and_wait(workflow):
    data = json.dumps(workflow).encode("utf-8")
    req = urllib.request.Request(
        f"{API}/prompt", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        prompt_id = json.loads(resp.read().decode())["prompt_id"]
    while True:
        with urllib.request.urlopen(f"{API}/history/{prompt_id}") as resp:
            history = json.loads(resp.read().decode())
        if prompt_id in history:
            return history[prompt_id].get("outputs", {})
        time.sleep(5)


def collect_files(outputs):
    files = []
    for node_output in outputs.values():
        for value in node_output.values():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and "filename" in item:
                        files.append(os.path.join(COMFY_OUTPUT, item["filename"]))
    return files


def render_all(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # If MP4 was requested, make sure the VideoHelperSuite node actually loaded.
    if OUTPUT_FORMAT == "mp4":
        try:
            with urllib.request.urlopen(f"{API}/object_info/VHS_VideoCombine", timeout=5) as resp:
                json.loads(resp.read().decode())
        except Exception:
            raise RuntimeError(
                "VHS_VideoCombine node not found — re-run the VideoHelperSuite "
                "install and restart the runtime, or set OUTPUT_FORMAT = 'webp'."
            )

    results = []
    for idx, scene in enumerate(SCENES, start=1):
        params = {**DEFAULTS, **scene}
        prefix = params.pop("prefix")
        prompt = params.pop("prompt")
        print(f"\n=== Rendering scene {idx}: {prefix} ===")

        workflow = {
            "prompt": {
                "1": {"inputs": {"unet_name": MODEL_FILES["unet_name"]}, "class_type": "UNETLoader"},
                "2": {"inputs": {"text": prompt, "clip": ["3", 0]}, "class_type": "CLIPTextEncode"},
                "3": {"inputs": {"clip_name": MODEL_FILES["clip_name"], "type": "wan"}, "class_type": "CLIPLoader"},
                "4": {"inputs": {"text": "blurry, low quality, deformed, artifacts", "clip": ["3", 0]}, "class_type": "CLIPTextEncode"},
                "5": {"inputs": {
                    "width": params["width"], "height": params["height"],
                    "length": params["length"], "batch_size": 1,
                }, "class_type": "WanEmptyLatentVideo"},
                # model_type="wan" is required for Wan models in current ComfyUI.
                "6": {"inputs": {
                    "seed": params["seed"] if params["seed"] is not None else int(time.time()) + idx,
                    "steps": params["steps"],
                    "cfg": params["cfg"],
                    "sampler_name": params["sampler_name"],
                    "scheduler": params["scheduler"],
                    "model_type": "wan",
                    "positive": ["2", 0],
                    "negative": ["4", 0],
                    "model": ["1", 0],
                    "latent_image": ["5", 0],
                }, "class_type": "KSampler"},
                "7": {"inputs": {"vae_name": MODEL_FILES["vae_name"]}, "class_type": "VAELoader"},
                "8": {"inputs": {"samples": ["6", 0], "vae": ["7", 0]}, "class_type": "VAEDecode"},
            }
        }

        if OUTPUT_FORMAT == "mp4":
            workflow["prompt"]["9"] = {"inputs": {
                "images": ["8", 0],
                "frame_rate": float(params["fps"]),
                "loop_count": 0,
                "filename_prefix": prefix,
                "format": "video/h264-mp4",
                "pix_fmt": "yuv420p",
                "fps": params["fps"],
                "codec": "libx264",
                "quality": 1,
                "pix_fmt_in_image": "rgb24",
            }, "class_type": "VHS_VideoCombine"}
        else:
            workflow["prompt"]["9"] = {"inputs": {
                "filename_prefix": prefix,
                "fps": params["fps"],
                "images": ["8", 0],
            }, "class_type": "SaveAnimatedWEBP"}

        outputs = queue_and_wait(workflow)
        files = collect_files(outputs)
        if not files:
            print("  No output files found. Check the ComfyUI console for errors.")
            continue
        for src in files:
            dst = os.path.join(output_dir, os.path.basename(src))
            shutil.copy2(src, dst)
            print("  Saved:", dst)
            results.append(dst)

    print(f"\nDone — {len(results)} file(s) in Google Drive:", output_dir)


# --------------------------------------------------------------------------- #
# main — run the whole factory in order
# --------------------------------------------------------------------------- #

def main():
    check_gpu()
    output_dir = mount_drive()
    setup_comfyui()
    download_models()
    install_vhs()
    start_comfyui()
    render_all(output_dir)


if __name__ == "__main__":
    main()
