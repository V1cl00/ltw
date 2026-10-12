#!/bin/bash
# Komprimiert neue Meshy-GLBs wie die v25-Charge (gltf-transform 4.5.1 + ktx 4.4):
# dedup → prune → resize (max 1024, Einheiten 512) → KTX2 UASTC (Normal) → KTX2 ETC1S (Rest) → meshopt
# Aufruf: tools/compress_glb.sh assets/meshy/mine_depot.glb [512]
set -e; f="$1"; max="${2:-1024}"; o=/tmp/_c_$$.glb; mkdir -p /workspace/meshy_orig; cp -n "$f" /workspace/meshy_orig/ || true
npx -y @gltf-transform/cli@4.5.1 dedup "$f" $o.1.glb
npx -y @gltf-transform/cli@4.5.1 prune $o.1.glb $o.2.glb
npx -y @gltf-transform/cli@4.5.1 resize $o.2.glb $o.3.glb --width $max --height $max
npx -y @gltf-transform/cli@4.5.1 uastc $o.3.glb $o.4.glb --slots "normalTexture"
npx -y @gltf-transform/cli@4.5.1 etc1s $o.4.glb $o.5.glb --slots "{baseColorTexture,emissiveTexture,metallicRoughnessTexture,occlusionTexture}"
npx -y @gltf-transform/cli@4.5.1 meshopt $o.5.glb $o.6.glb
cp $o.6.glb "$f"; rm -f $o.*; ls -la "$f"
