import argparse
import math
import pathlib
import sys

import bpy


ROOT = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "public" / "models" / "noir-kit"


def parse_args():
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Generate Voice Thief noir GLB assets.")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Directory for exported GLB files.")
    return parser.parse_args(argv)


def desired_pos(x, y, z):
    # The game uses Three.js Y-up coordinates. Blender authors in Z-up and the
    # glTF exporter converts to Y-up, so map game depth into Blender -Y.
    return (x, -z, y)


def desired_dims(width, height, depth):
    return (width, depth, height)


def rgba(hex_color, alpha=1.0):
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16) / 255,
        int(value[2:4], 16) / 255,
        int(value[4:6], 16) / 255,
        alpha,
    )


def set_input(node, name, value):
    if name in node.inputs:
        node.inputs[name].default_value = value


def material(name, color, roughness=0.75, metallic=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        set_input(bsdf, "Base Color", rgba(color))
        set_input(bsdf, "Roughness", roughness)
        set_input(bsdf, "Metallic", metallic)
        if emission:
            set_input(bsdf, "Emission Color", rgba(emission))
            set_input(bsdf, "Emission Strength", strength)
    return mat


def make_materials():
    return {
        "asphalt": material("wet blue black asphalt", "#161b28", 0.9, 0.05),
        "bank_stone": material("aged blue granite", "#313443", 0.82, 0.0),
        "bank_dark": material("shadowed granite cuts", "#171923", 0.88, 0.0),
        "bank_trim": material("polished stone bevels", "#585a6d", 0.55, 0.0),
        "brick": material("rain dark red brick", "#2a1718", 0.86, 0.0),
        "brick_alt": material("oxidized brick variation", "#3a2020", 0.9, 0.0),
        "apartment_brick": material("purple brown apartment brick", "#342633", 0.88, 0.0),
        "black": material("lacquer black enamel", "#07070b", 0.7, 0.0),
        "glass_warm": material("warm smoky glass", "#17100a", 0.2, 0.0, "#f5a623", 0.9),
        "glass_dim": material("dim smoked glass", "#0a0a10", 0.35, 0.0, "#6c4b22", 0.16),
        "glass_teal": material("teal glass glow", "#071512", 0.24, 0.0, "#3affa6", 0.75),
        "neon_red": material("red neon tubing", "#1a0506", 0.35, 0.0, "#ff3030", 2.8),
        "neon_amber": material("amber neon tubing", "#160a04", 0.38, 0.0, "#f5a623", 2.2),
        "neon_teal": material("teal signal neon", "#061312", 0.4, 0.0, "#3affa6", 2.0),
        "brass": material("aged brushed brass", "#a87828", 0.32, 0.9),
        "dark_metal": material("oiled black metal", "#12141a", 0.42, 0.75),
        "wood": material("dark varnished wood", "#3a2114", 0.5, 0.05),
        "red_paint": material("chipped red enamel", "#8e211b", 0.56, 0.12),
        "cream": material("aged cream enamel", "#e9d8b6", 0.72, 0.0),
        "marble": material("muted marble counter", "#7d7f8f", 0.38, 0.05),
        "paper": material("ledger paper", "#efe3c4", 0.82, 0.0),
        "green": material("exit green glass", "#092017", 0.45, 0.0, "#3affa6", 1.5),
    }


MATS = {}


def select(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def add_bevel(obj, width=0.035, segments=2):
    if width <= 0:
        return obj
    bevel = obj.modifiers.new("small bevels", "BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.affect = "EDGES"
    normal = obj.modifiers.new("weighted corner normals", "WEIGHTED_NORMAL")
    normal.keep_sharp = True
    return obj


def box(name, size, pos, mat, bevel=0.035, rot=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=desired_pos(*pos))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = desired_dims(*size)
    select(obj)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.append(mat)
    add_bevel(obj, bevel)
    return obj


def cylinder(name, radius, height, pos, mat, vertices=24, bevel=False, axis="y"):
    rotation = (0.0, 0.0, 0.0)
    if axis == "x":
        rotation = (0.0, math.radians(90), 0.0)
    elif axis == "z":
        rotation = (math.radians(90), 0.0, 0.0)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=height,
        location=desired_pos(*pos),
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        add_bevel(obj, 0.012, 1)
    return obj


def sphere(name, radius, pos, mat, segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=max(8, segments // 2),
        radius=radius,
        location=desired_pos(*pos),
    )
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    return obj


def text_label(name, body, size, pos, mat, align="CENTER", extrude=0.01):
    bpy.ops.object.text_add(location=desired_pos(*pos), rotation=(math.radians(90), 0.0, 0.0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = extrude
    obj.data.resolution_u = 8
    obj.data.materials.append(mat)
    select(obj)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    add_bevel(obj, 0.003, 1)
    return obj


def panel_line(prefix, width, height, z, y_min, y_max, mat):
    count = int((y_max - y_min) / height)
    for i in range(count + 1):
        y = y_min + i * height
        box(f"{prefix} horizontal seam {i}", [width, 0.025, 0.035], [0, y, z], mat, 0.002)


def brick_course(prefix, width, z, y_values, mat):
    for row, y in enumerate(y_values):
        offset = 0.32 if row % 2 else 0.0
        x = -width / 2 + 0.55 + offset
        i = 0
        while x < width / 2:
            box(f"{prefix} mortar joint {row}-{i}", [0.035, 0.22, 0.025], [x, y, z], mat, 0.001)
            x += 1.1
            i += 1


def rain_streaks(prefix, xs, y_top, z, mat, heights=(0.55, 0.9, 1.25)):
    for i, x in enumerate(xs):
        h = heights[i % len(heights)]
        box(f"{prefix} rain streak {i}", [0.026, h, 0.018], [x, y_top - h / 2, z], mat, 0.001)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def bank_facade():
    box("single solid bank shell", [8.55, 6.65, 5.8], [0, 3.08, -3.02], MATS["bank_stone"], 0.08)
    box("recessed shadow vestibule volume", [3.0, 3.25, 0.14], [0, 1.82, 0.28], MATS["black"], 0.025)
    box("granite plinth with bevels", [8.9, 0.88, 0.86], [0, 0.45, 0.2], MATS["bank_trim"], 0.05)
    box("lower wet front step", [4.5, 0.16, 0.66], [0, 0.08, 1.0], MATS["bank_trim"], 0.02)
    box("upper worn front step", [3.55, 0.16, 0.5], [0, 0.25, 0.67], MATS["bank_stone"], 0.02)

    panel_line("bank ashlar", 8.1, 0.78, 0.02, 1.05, 5.8, MATS["bank_dark"])
    for x in [-3.85, -2.05, 0.0, 2.05, 3.85]:
        box(f"bank vertical stone joint {x}", [0.03, 4.55, 0.035], [x, 3.35, 0.03], MATS["bank_dark"], 0.002)

    for i, x in enumerate([-3.25, -1.15, 1.15, 3.25]):
        cylinder(f"round fluted granite column {i}", 0.33, 5.05, [x, 3.3, 0.36], MATS["bank_trim"], 28)
        cylinder(f"column base cap {i}", 0.42, 0.18, [x, 0.85, 0.36], MATS["bank_trim"], 28, True)
        cylinder(f"column top cap {i}", 0.43, 0.2, [x, 5.78, 0.36], MATS["bank_trim"], 28, True)
        for j, dx in enumerate([-0.19, 0.0, 0.19]):
            box(f"column dark flute {i}-{j}", [0.032, 4.45, 0.04], [x + dx, 3.28, 0.7], MATS["bank_dark"], 0.001)

    box("heavy stepped cornice lower", [9.0, 0.34, 0.72], [0, 6.1, 0.35], MATS["bank_trim"], 0.04)
    box("heavy stepped cornice upper", [8.4, 0.24, 0.48], [0, 6.42, 0.46], MATS["bank_stone"], 0.035)
    box("red neon bank underline tube", [6.7, 0.09, 0.07], [0, 6.66, 0.72], MATS["neon_red"], 0.025)
    text_label("first city bank mesh sign", "FIRST CITY BANK", 0.32, [0, 6.02, 0.82], MATS["cream"])

    for side, x in [("left", -0.54), ("right", 0.54)]:
        box(f"{side} varnished brass door", [1.02, 2.3, 0.09], [x, 1.58, 0.41], MATS["wood"], 0.025)
        box(f"{side} bevelled door inset", [0.68, 1.62, 0.035], [x, 1.55, 0.48], MATS["black"], 0.01)
    box("door warm transom glass", [2.35, 0.42, 0.055], [0, 3.02, 0.48], MATS["glass_warm"], 0.018)
    sphere("left brass door knob", 0.055, [-0.16, 1.54, 0.52], MATS["brass"])
    sphere("right brass door knob", 0.055, [0.16, 1.54, 0.52], MATS["brass"])

    for ix, x in enumerate([-2.38, 2.38]):
        box(f"bank window stone recess {ix}", [1.7, 2.05, 0.1], [x, 2.78, 0.31], MATS["bank_dark"], 0.02)
        box(f"bank warm barred glass {ix}", [1.43, 1.78, 0.045], [x, 2.78, 0.39], MATS["glass_warm"], 0.012)
        for j, bx in enumerate([-0.48, -0.16, 0.16, 0.48]):
            cylinder(f"bank window vertical bar {ix}-{j}", 0.018, 1.86, [x + bx, 2.78, 0.48], MATS["dark_metal"], 8, True)
        for j, by in enumerate([-0.48, 0.0, 0.48]):
            box(f"bank window brass rail {ix}-{j}", [1.48, 0.045, 0.05], [x, 2.78 + by, 0.5], MATS["brass"], 0.006)

    for i, x in enumerate([-1.48, 1.48]):
        sphere(f"bank exterior globe sconce {i}", 0.12, [x, 2.62, 0.62], MATS["neon_amber"], 24)
        cylinder(f"bank sconce bracket {i}", 0.02, 0.25, [x, 2.62, 0.5], MATS["brass"], 8, True, "z")

    box("small brass address plaque", [0.85, 0.3, 0.045], [3.42, 0.76, 0.62], MATS["brass"], 0.012)
    rain_streaks("bank", [-3.7, -2.9, -1.8, -0.5, 0.8, 1.9, 3.1, 3.8], 5.6, 0.06, MATS["bank_dark"])


def cafe_facade():
    box("deep diner brick shell", [6.65, 5.18, 5.7], [0, 2.62, -2.85], MATS["brick"], 0.07)
    box("glazed tile base", [6.85, 0.72, 0.82], [0, 0.36, 0.18], MATS["brick_alt"], 0.045)
    brick_course("cafe", 6.2, 0.05, [1.08, 1.48, 1.88, 2.28, 2.68, 3.08, 3.48, 3.88, 4.28], MATS["black"])
    panel_line("cafe mortar", 6.2, 0.4, 0.04, 1.0, 4.6, MATS["black"])

    box("diner sign enamel backbox", [4.45, 0.52, 0.17], [-0.55, 4.78, 0.48], MATS["black"], 0.025)
    box("amber all night sign glow", [4.18, 0.25, 0.07], [-0.55, 4.78, 0.59], MATS["neon_amber"], 0.025)
    text_label("all night cafe mesh sign", "ALL NIGHT", 0.25, [-0.55, 4.78, 0.68], MATS["cream"])

    box("wide diner window recess", [3.7, 2.42, 0.1], [-1.05, 2.38, 0.28], MATS["black"], 0.02)
    for cx in range(5):
        for cy in range(3):
            x = -2.35 + cx * 0.65
            y = 1.68 + cy * 0.68
            lit = (cx * 31 + cy * 17) % 5 != 0
            box(f"diner glass pane {cx}-{cy}", [0.56, 0.58, 0.045], [x, y, 0.38], MATS["glass_warm" if lit else "glass_dim"], 0.01)
    for i, x in enumerate([-2.66, -2.01, -1.36, -0.71, -0.06, 0.59]):
        box(f"diner black mullion {i}", [0.045, 2.16, 0.06], [x, 2.36, 0.47], MATS["black"], 0.004)
    for i, y in enumerate([1.35, 2.04, 2.72, 3.4]):
        box(f"diner horizontal mullion {i}", [3.35, 0.045, 0.06], [-1.05, y, 0.47], MATS["black"], 0.004)

    for i, x in enumerate([-1.9, -1.3, -0.7, -0.1, 0.5, 1.1]):
        mat = MATS["red_paint"] if i % 2 == 0 else MATS["cream"]
        box(f"striped metal awning panel {i}", [0.54, 0.12, 1.08], [x, 4.08, 0.68], mat, 0.012)
    box("awning front lip", [3.55, 0.18, 0.12], [-0.38, 3.82, 1.2], MATS["dark_metal"], 0.012)

    box("diner side wood door", [1.05, 2.2, 0.09], [2.04, 1.38, 0.34], MATS["wood"], 0.025)
    box("diner door lit glass", [0.62, 0.95, 0.045], [2.04, 1.72, 0.42], MATS["glass_warm"], 0.012)
    box("diner brass kickplate", [0.86, 0.16, 0.035], [2.04, 0.45, 0.45], MATS["brass"], 0.006)
    sphere("diner brass knob", 0.046, [2.4, 1.4, 0.48], MATS["brass"])
    sphere("visible hanging bulb behind glass", 0.08, [1.42, 3.36, 0.48], MATS["neon_amber"])
    rain_streaks("cafe", [-3.0, -2.45, -1.72, -0.42, 0.95, 1.72, 2.65], 4.45, 0.07, MATS["black"])


def apartment_block():
    box("tall lived in apartment shell", [6.15, 8.0, 5.85], [0, 4.0, -2.92], MATS["apartment_brick"], 0.075)
    brick_course(
        "apartment",
        5.7,
        0.05,
        [0.8, 1.15, 1.5, 1.85, 2.2, 2.55, 2.9, 3.25, 3.6, 3.95, 4.3, 4.65, 5.0, 5.35, 5.7, 6.05],
        MATS["black"],
    )
    panel_line("apartment long mortar", 5.85, 0.35, 0.04, 0.75, 6.3, MATS["black"])

    box("red apartment cornice awning", [6.35, 0.58, 0.52], [0, 6.95, 0.36], MATS["red_paint"], 0.04)
    box("roof amber neon gutter", [6.15, 0.13, 0.075], [0, 7.95, 0.55], MATS["neon_amber"], 0.02)
    box("left drain pipe", [0.07, 7.25, 0.07], [-3.0, 3.92, 0.54], MATS["dark_metal"], 0.01)
    box("right drain pipe", [0.07, 7.25, 0.07], [3.0, 3.92, 0.54], MATS["dark_metal"], 0.01)

    for row in range(4):
        for col in range(3):
            x = -1.9 + col * 1.9
            y = 1.9 + row * 1.25
            lit = (row + col) % 3 != 1
            box(f"apartment deep window recess {row}-{col}", [1.12, 1.08, 0.08], [x, y, 0.28], MATS["black"], 0.015)
            box(f"apartment smoky pane {row}-{col}", [0.88, 0.82, 0.04], [x, y, 0.39], MATS["glass_warm" if lit else "glass_dim"], 0.01)
            box(f"apartment stone sill {row}-{col}", [1.08, 0.07, 0.18], [x, y - 0.49, 0.52], MATS["bank_trim"], 0.01)
            box(f"apartment window horizontal cross {row}-{col}", [0.88, 0.035, 0.045], [x, y, 0.47], MATS["black"], 0.004)
            box(f"apartment window vertical cross {row}-{col}", [0.035, 0.82, 0.045], [x, y, 0.47], MATS["black"], 0.004)

    for i, y in enumerate([4.2, 5.65]):
        box(f"fire escape grated platform {i}", [1.85, 0.055, 0.6], [0.0, y, 0.82], MATS["dark_metal"], 0.004)
        box(f"fire escape front rail {i}", [1.85, 0.055, 0.045], [0.0, y + 0.28, 1.12], MATS["dark_metal"], 0.004)
        for j, x in enumerate([-0.78, -0.39, 0.0, 0.39, 0.78]):
            box(f"fire escape picket {i}-{j}", [0.04, 0.42, 0.04], [x, y + 0.13, 1.02], MATS["dark_metal"], 0.004)
    for step in range(7):
        box(f"angled fire escape stair tread {step}", [0.8, 0.04, 0.18], [0.95 - step * 0.16, 4.48 + step * 0.16, 0.88], MATS["dark_metal"], 0.004)

    box("front apartment entry door", [1.18, 2.25, 0.09], [0, 1.23, 0.42], MATS["wood"], 0.025)
    box("apartment frosted entry pane", [0.66, 0.86, 0.045], [0, 1.62, 0.5], MATS["glass_teal"], 0.012)
    sphere("apartment entry bulb globe", 0.09, [0, 2.62, 0.63], MATS["neon_amber"])
    rain_streaks("apartment", [-2.75, -2.1, -1.2, -0.45, 0.35, 1.1, 1.85, 2.55], 7.45, 0.07, MATS["black"])


def payphone():
    box("payphone cast iron base", [0.98, 0.16, 0.52], [0, 0.08, -0.02], MATS["dark_metal"], 0.025)
    box("red phone booth back plate", [1.08, 2.45, 0.12], [0, 1.42, -0.24], MATS["red_paint"], 0.035)
    box("phone booth side left frame", [0.1, 2.28, 0.5], [-0.58, 1.45, -0.02], MATS["red_paint"], 0.018)
    box("phone booth side right frame", [0.1, 2.28, 0.5], [0.58, 1.45, -0.02], MATS["red_paint"], 0.018)
    box("phone booth roof lip", [1.22, 0.18, 0.62], [0, 2.68, -0.02], MATS["red_paint"], 0.025)
    box("telephone sign milk glass", [0.78, 0.22, 0.06], [0, 2.48, 0.16], MATS["neon_red"], 0.018)
    text_label("telephone raised letters", "PHONE", 0.12, [0, 2.48, 0.22], MATS["cream"])

    box("rounded phone cabinet", [0.74, 0.9, 0.38], [0, 1.32, 0.04], MATS["red_paint"], 0.045)
    box("black bakelite face plate", [0.66, 0.8, 0.045], [0, 1.32, 0.26], MATS["black"], 0.015)
    box("brass coin slot", [0.22, 0.045, 0.04], [0, 1.58, 0.31], MATS["brass"], 0.004)
    cylinder("rotary dial black wheel", 0.16, 0.035, [0, 1.31, 0.31], MATS["black"], 28, True, "z")
    cylinder("rotary dial brass center", 0.045, 0.04, [0, 1.31, 0.34], MATS["brass"], 18, True, "z")
    for i in range(10):
        angle = i * math.tau / 10
        x = math.cos(angle) * 0.105
        y = math.sin(angle) * 0.105
        cylinder(f"rotary finger hole {i}", 0.011, 0.045, [x, 1.31 + y, 0.35], MATS["brass"], 10, True, "z")
    box("coin return cup", [0.2, 0.07, 0.04], [0, 1.06, 0.31], MATS["dark_metal"], 0.006)
    cylinder("curved black handset grip", 0.055, 0.46, [0.44, 1.3, 0.1], MATS["dark_metal"], 14, True)
    sphere("handset earpiece cap", 0.075, [0.44, 1.52, 0.1], MATS["dark_metal"], 18)
    sphere("handset mouthpiece cap", 0.075, [0.44, 1.08, 0.1], MATS["dark_metal"], 18)
    for i in range(6):
        cylinder(f"coiled phone cord loop {i}", 0.025 + i * 0.002, 0.06, [0.31 - i * 0.025, 1.22 + i * 0.018, 0.14], MATS["black"], 12, True, "z")


def train_station():
    box("wet station platform slab", [3.5, 0.22, 1.14], [0, 0.12, 0], MATS["bank_trim"], 0.035)
    box("platform chipped front edge", [3.55, 0.08, 0.08], [0, 0.27, 0.6], MATS["cream"], 0.006)
    for i, x in enumerate([-1.25, 1.25]):
        cylinder(f"station iron arch leg {i}", 0.08, 1.68, [x, 0.94, 0], MATS["dark_metal"], 18, True)
        cylinder(f"station leg foot {i}", 0.16, 0.08, [x, 0.18, 0], MATS["dark_metal"], 18, True)
    box("station lintel iron crossbar", [2.62, 0.18, 0.32], [0, 1.82, 0], MATS["dark_metal"], 0.018)
    box("last train sign glass box", [1.88, 0.42, 0.06], [0, 1.32, 0.22], MATS["neon_amber"], 0.018)
    text_label("last train sign letters", "LAST TRAIN", 0.13, [0, 1.32, 0.28], MATS["black"])
    box("left brass rail", [3.2, 0.045, 0.045], [0, 0.3, -0.44], MATS["brass"], 0.008)
    box("right brass rail", [3.2, 0.045, 0.045], [0, 0.3, 0.44], MATS["brass"], 0.008)
    for i, x in enumerate([-1.0, -0.5, 0.0, 0.5, 1.0]):
        box(f"oily wood rail tie {i}", [0.08, 0.045, 1.0], [x, 0.26, 0], MATS["wood"], 0.006)
    sphere("left station signal globe", 0.15, [-0.65, 1.36, 0.3], MATS["neon_amber"])
    sphere("right station signal globe", 0.15, [0.65, 1.36, 0.3], MATS["neon_teal"])


def teller_counter():
    box("long dark oak teller counter body", [10.0, 1.1, 0.94], [0, 0.55, 0], MATS["wood"], 0.045)
    box("thick marble counter slab", [10.25, 0.11, 1.06], [0, 1.14, 0], MATS["marble"], 0.035)
    box("brass toe rail across counter", [10.3, 0.045, 0.045], [0, 1.02, 0.52], MATS["brass"], 0.006)
    for i, x in enumerate([-4.6, -1.65, 1.65, 4.6]):
        box(f"carved oak counter pilaster {i}", [0.2, 1.1, 0.58], [x, 0.55, 0.28], MATS["wood"], 0.018)
        box(f"pilaster brass cap {i}", [0.24, 0.06, 0.6], [x, 1.05, 0.29], MATS["brass"], 0.006)
    for i, x in enumerate([-3.3, 0.0, 3.3]):
        box(f"teller cage smoked glass {i}", [2.35, 1.0, 0.08], [x, 1.68, -0.4], MATS["glass_dim"], 0.012)
        box(f"teller cage warm interior glow {i}", [1.9, 0.66, 0.035], [x, 1.68, -0.33], MATS["glass_warm"], 0.008)
        box(f"teller cage top rail {i}", [2.48, 0.06, 0.06], [x, 2.18, -0.27], MATS["brass"], 0.006)
        box(f"teller cage bottom rail {i}", [2.48, 0.06, 0.06], [x, 1.18, -0.27], MATS["brass"], 0.006)
        for j, bx in enumerate([-0.74, -0.37, 0.0, 0.37, 0.74]):
            cylinder(f"teller cage vertical bar {i}-{j}", 0.018, 0.78, [x + bx, 1.68, -0.24], MATS["dark_metal"], 8, True)
    box("open ledger book left page", [0.62, 0.035, 0.42], [-3.08, 1.24, 0.12], MATS["paper"], 0.006)
    box("open ledger book right page", [0.62, 0.035, 0.42], [-2.48, 1.245, 0.12], MATS["paper"], 0.006)
    box("ledger dark spine", [0.08, 0.05, 0.44], [-2.78, 1.255, 0.12], MATS["wood"], 0.003)
    cylinder("banker lamp brass stem", 0.022, 0.38, [3.5, 1.38, 0.12], MATS["brass"], 12, True)
    sphere("banker lamp green shade glow", 0.14, [3.5, 1.63, 0.12], MATS["green"], 24)
    box("ink stamp body", [0.22, 0.12, 0.18], [2.65, 1.23, 0.08], MATS["dark_metal"], 0.01)
    box("small teller bell", [0.18, 0.06, 0.18], [4.3, 1.22, 0.04], MATS["brass"], 0.012)


def cafe_interior():
    box("cafe long walnut counter body", [10.0, 1.1, 1.0], [0, 0.55, -3.5], MATS["wood"], 0.045)
    box("cafe black stone counter top", [10.25, 0.08, 1.08], [0, 1.14, -3.5], MATS["black"], 0.026)
    box("cafe brass kickplate", [10.0, 0.18, 0.04], [0, 0.12, -3.02], MATS["brass"], 0.006)
    box("cafe brass counter nosing", [10.25, 0.045, 0.045], [0, 1.17, -2.98], MATS["brass"], 0.006)

    for i, x in enumerate([-4.25, -2.15, 0.0, 2.15, 4.25]):
        box(f"cafe counter inset panel {i}", [1.55, 0.62, 0.035], [x, 0.55, -2.97], MATS["black"], 0.008)
        box(f"cafe counter panel brass trim {i}", [1.72, 0.06, 0.04], [x, 0.88, -2.93], MATS["brass"], 0.004)
        box(f"cafe counter panel lower trim {i}", [1.72, 0.06, 0.04], [x, 0.23, -2.93], MATS["brass"], 0.004)

    box("espresso machine rounded brass body", [1.35, 0.72, 0.68], [-3.0, 1.56, -3.5], MATS["brass"], 0.05)
    box("espresso black drip tray", [1.1, 0.05, 0.48], [-3.0, 1.2, -3.13], MATS["black"], 0.006)
    cylinder("espresso boiler dome", 0.18, 0.25, [-3.0, 2.06, -3.5], MATS["brass"], 24, True)
    cylinder("espresso pressure gauge", 0.12, 0.035, [-3.0, 1.72, -3.12], MATS["cream"], 24, True, "z")
    cylinder("espresso steam wand", 0.018, 0.44, [-3.7, 1.62, -3.07], MATS["dark_metal"], 10, True, "z")
    for i, x in enumerate([-3.42, -3.22, -3.02, -2.82, -2.62]):
        cylinder(f"stacked diner cup {i}", 0.06, 0.1, [x, 2.2, -3.28], MATS["cream"], 16, True)

    box("cash register dark base", [0.82, 0.45, 0.52], [3.5, 1.38, -3.5], MATS["wood"], 0.026)
    box("cash register brass drawer", [0.7, 0.12, 0.38], [3.5, 1.24, -3.18], MATS["brass"], 0.008)
    box("cash register number display", [0.62, 0.08, 0.18], [3.5, 1.66, -3.14], MATS["glass_warm"], 0.006)
    for i, x in enumerate([3.22, 3.38, 3.54, 3.7]):
        cylinder(f"cash register ivory key {i}", 0.035, 0.035, [x, 1.61, -3.1], MATS["cream"], 12, True, "z")

    for i, x in enumerate([-3.0, -1.5, 0.0, 1.5, 3.0]):
        cylinder(f"red leather stool cushion {i}", 0.2, 0.08, [x, 0.72, -2.0], MATS["red_paint"], 28, True)
        cylinder(f"stool black pedestal {i}", 0.04, 0.68, [x, 0.34, -2.0], MATS["dark_metal"], 14, True)
        cylinder(f"stool foot ring {i}", 0.18, 0.035, [x, 0.18, -2.0], MATS["dark_metal"], 20, True)

    for i, x in enumerate([-3.0, 0.0, 3.0]):
        cylinder(f"edison bulb cord {i}", 0.01, 0.82, [x, 3.42, -1.8], MATS["black"], 6)
        sphere(f"edison glass bulb {i}", 0.105, [x, 3.0, -1.8], MATS["neon_amber"], 20)
        cylinder(f"edison brass socket {i}", 0.055, 0.08, [x, 3.12, -1.8], MATS["brass"], 14, True)

    box("jukebox red cabinet", [1.12, 1.38, 0.62], [5.5, 0.72, -2.5], MATS["red_paint"], 0.055)
    cylinder("jukebox chrome arch left", 0.055, 1.35, [5.08, 1.18, -2.18], MATS["brass"], 14, True)
    cylinder("jukebox chrome arch right", 0.055, 1.35, [5.92, 1.18, -2.18], MATS["brass"], 14, True)
    box("jukebox glowing song window", [0.72, 0.52, 0.035], [5.5, 1.05, -2.16], MATS["glass_warm"], 0.01)
    box("jukebox black speaker grille", [0.78, 0.36, 0.035], [5.5, 0.48, -2.16], MATS["black"], 0.008)
    for j in range(5):
        box(f"jukebox brass grille slat {j}", [0.68, 0.018, 0.04], [5.5, 0.36 + j * 0.065, -2.12], MATS["brass"], 0.002)

    for i, x in enumerate([-3.0, 3.0]):
        cylinder(f"round cafe table top {i}", 0.52, 0.06, [x, 0.72, 1.5], MATS["wood"], 32, True)
        cylinder(f"round cafe table pedestal {i}", 0.045, 0.7, [x, 0.36, 1.5], MATS["dark_metal"], 14, True)
        cylinder(f"round cafe table base {i}", 0.24, 0.045, [x, 0.04, 1.5], MATS["dark_metal"], 24, True)
        cylinder(f"white coffee cup {i}", 0.07, 0.11, [x - 0.15, 0.82, 1.42], MATS["cream"], 16, True)
        box(f"folded receipt on table {i}", [0.36, 0.015, 0.2], [x + 0.12, 0.76, 1.58], MATS["paper"], 0.002)


def living_room():
    box("burgundy rug field", [5.5, 0.035, 4.5], [0, 0.025, 0], MATS["red_paint"], 0.008)
    box("burgundy rug inset pattern", [4.6, 0.02, 3.6], [0, 0.05, 0], MATS["brick_alt"], 0.004)
    for i, z in enumerate([-1.55, -0.75, 0.05, 0.85, 1.65]):
        box(f"rug muted stripe {i}", [4.35, 0.012, 0.08], [0, 0.065, z], MATS["wood"], 0.002)

    box("tufted sofa base", [3.5, 0.68, 1.22], [-3.0, 0.42, -3.0], MATS["wood"], 0.055)
    box("tufted sofa high back", [3.55, 0.92, 0.34], [-3.0, 1.05, -3.55], MATS["wood"], 0.055)
    box("sofa left rounded arm", [0.28, 0.88, 1.34], [-4.72, 0.82, -3.0], MATS["wood"], 0.05)
    box("sofa right rounded arm", [0.28, 0.88, 1.34], [-1.28, 0.82, -3.0], MATS["wood"], 0.05)
    for i, x in enumerate([-4.05, -3.0, -1.95]):
        box(f"sofa individual cushion {i}", [0.96, 0.24, 1.02], [x, 0.86, -2.9], MATS["brick_alt"], 0.05)
        sphere(f"sofa brass tuft button {i}a", 0.035, [x - 0.22, 0.98, -2.38], MATS["brass"], 12)
        sphere(f"sofa brass tuft button {i}b", 0.035, [x + 0.22, 0.98, -2.38], MATS["brass"], 12)

    box("rectangular coffee table slab", [1.65, 0.09, 0.92], [0, 0.46, -1.0], MATS["wood"], 0.025)
    for i, (x, z) in enumerate([(-0.72, -1.42), (0.72, -1.42), (-0.72, -0.58), (0.72, -0.58)]):
        cylinder(f"coffee table tapered leg {i}", 0.045, 0.42, [x, 0.24, z], MATS["wood"], 10, True)
    box("folded newspaper on coffee table", [0.62, 0.018, 0.42], [0.22, 0.52, -0.95], MATS["paper"], 0.003)
    cylinder("tea cup on coffee table", 0.065, 0.075, [-0.5, 0.56, -1.0], MATS["cream"], 16, True)

    box("side table round top proxy", [0.92, 0.08, 0.92], [3.0, 0.46, -3.0], MATS["wood"], 0.028)
    for i, (x, z) in enumerate([(2.64, -3.36), (3.36, -3.36), (2.64, -2.64), (3.36, -2.64)]):
        cylinder(f"side table thin leg {i}", 0.03, 0.44, [x, 0.24, z], MATS["wood"], 8, True)
    cylinder("table lamp brass base", 0.1, 0.045, [3.22, 0.52, -2.78], MATS["brass"], 18, True)
    cylinder("table lamp stem", 0.02, 0.55, [3.22, 0.8, -2.78], MATS["brass"], 12, True)
    cylinder("warm lamp shade", 0.2, 0.23, [3.22, 1.16, -2.78], MATS["neon_amber"], 18, True)

    box("black rotary phone base", [0.36, 0.15, 0.26], [2.78, 0.56, -3.08], MATS["black"], 0.02)
    cylinder("rotary phone handset", 0.045, 0.32, [2.78, 0.72, -3.08], MATS["black"], 12, True, "x")
    cylinder("rotary phone dial brass", 0.075, 0.025, [2.78, 0.64, -2.93], MATS["brass"], 22, True, "z")

    for i, x in enumerate([-2.0, 0.0, 2.0]):
        box(f"sepia wall photo frame {i}", [0.72, 0.92, 0.045], [x, 2.5, -4.86], MATS["wood"], 0.012)
        box(f"sepia wall photo print {i}", [0.55, 0.75, 0.025], [x, 2.5, -4.82], MATS["paper"], 0.004)
        box(f"photo shadow line {i}", [0.42, 0.035, 0.03], [x, 2.22, -4.79], MATS["brick_alt"], 0.002)


ASSETS = {
    "bank-facade": bank_facade,
    "cafe-facade": cafe_facade,
    "cafe-interior": cafe_interior,
    "apartment-block": apartment_block,
    "living-room": living_room,
    "payphone": payphone,
    "train-station": train_station,
    "teller-counter": teller_counter,
}


def export_asset(name, factory, out_dir):
    reset_scene()
    factory()
    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type in {"MESH", "FONT", "CURVE"})
    out_path = out_dir / f"{name}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
    )
    print(f"wrote {out_path.relative_to(ROOT)}")


def main():
    global MATS
    args = parse_args()
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.engine = "CYCLES"
    MATS = make_materials()
    for name, factory in ASSETS.items():
        export_asset(name, factory, out_dir)


if __name__ == "__main__":
    main()
