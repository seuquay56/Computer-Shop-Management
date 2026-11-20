import os
import subprocess
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams"))
os.makedirs(OUT_DIR, exist_ok=True)

# Member 2's exact cohesive UML palette (matching usecase_*.dot and class_diagram_overall.dot)
STYLE = {
    "font": "Arial",
    "actor_fill": "#e0e7ff",
    "actor_edge": "#3730a3",
    "external_fill": "#fef3c7",
    "external_edge": "#92400e",
    "action_fill": "#f0fdf4",
    "action_edge": "#166534",
    "entity_fill": "#f8fafc",
    "entity_edge": "#334155",
    "boundary_fill": "#f8fafc",
    "boundary_edge": "#64748b",
    "subcluster_edge": "#cbd5e1",
    "sync_arrow": "#334155",
    "return_arrow": "#0284c7",
    "return_text": "#0369a1",
    "text": "#0f172a",
    "muted_text": "#475569",
}


def draw_sequence_diagram(filename, boundary_title, participants, messages, frames=None, figsize=(13.5, 9.2)):
    """
    Draws a UML 2.5 Sequence Diagram styled identically to Member 2's Graphviz/UML palette:
    - Arial typography, soft pastel fills (#e0e7ff, #f8fafc, #f0fdf4, #fef3c7)
    - Crisp dark text on pastel rounded boxes with UML stereotypes (<<actor>>, <<boundary>>, <<service>>, <<database>>)
    - Dashed system boundary container (#64748b / #f8fafc)
    - Solid #334155 calls and dashed #0284c7 returns
    """
    fig, ax = plt.subplots(figsize=figsize, dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")

    n = len(participants)
    xs = [1.35 + i * (11.5 / max(1, n - 1)) for i in range(n)]
    row_step = 1.15
    top_y = len(messages) * row_step + 2.55
    bottom_y = 0.55

    ax.set_xlim(0.0, 14.3)
    ax.set_ylim(0.0, top_y + 0.95)
    ax.axis("off")

    # Outer dashed system boundary container (matching Member 2's cluster_system)
    outer = patches.Rectangle(
        (0.18, 0.12), 13.94, top_y + 0.72,
        facecolor=STYLE["boundary_fill"], edgecolor=STYLE["boundary_edge"],
        linewidth=1.2, linestyle=(0, (6, 4)), zorder=0
    )
    ax.add_patch(outer)
    ax.text(
        7.15, top_y + 0.56, boundary_title,
        ha="center", va="center", fontsize=12.0, fontweight="bold",
        color="#000000", family=STYLE["font"], zorder=2
    )

    box_w = 2.02 if n <= 5 else 1.84
    box_h = 0.76
    header_y = top_y - 0.18
    footer_y = bottom_y + 0.05

    def msg_y(idx):
        return top_y - 1.15 - idx * row_step

    # Lifelines & participant header/footer boxes
    for idx, pinfo in enumerate(participants):
        label, kind = pinfo
        x = xs[idx]

        if kind == "actor":
            fill, edge = STYLE["actor_fill"], STYLE["actor_edge"]
        elif kind == "external":
            fill, edge = STYLE["external_fill"], STYLE["external_edge"]
        elif kind == "action":
            fill, edge = STYLE["action_fill"], STYLE["action_edge"]
        else:
            fill, edge = STYLE["entity_fill"], STYLE["entity_edge"]

        # Dashed UML lifeline
        ax.plot(
            [x, x], [footer_y + box_h * 0.35, header_y - box_h / 2],
            linestyle=(0, (5, 4)), linewidth=1.1, color="#64748b", zorder=1
        )

        # Header rounded box (Member 2 style: pastel fill + colored 1.5pt border + black Arial text)
        rect = FancyBboxPatch(
            (x - box_w / 2, header_y - box_h / 2), box_w, box_h,
            boxstyle="round,pad=0.04,rounding_size=0.12",
            facecolor=fill, edgecolor=edge, linewidth=1.5, zorder=3
        )
        ax.add_patch(rect)
        ax.text(
            x, header_y, label, ha="center", va="center",
            fontsize=8.6, color="#000000", family=STYLE["font"],
            linespacing=1.22, zorder=4
        )

        # Footer box
        frect = FancyBboxPatch(
            (x - box_w / 2, footer_y - box_h * 0.34), box_w, box_h * 0.68,
            boxstyle="round,pad=0.03,rounding_size=0.10",
            facecolor="#FFFFFF", edgecolor=edge, linewidth=1.0, zorder=3
        )
        ax.add_patch(frect)
        short_label = label.split("\n", 1)[-1].replace("\n", " ")
        ax.text(
            x, footer_y, short_label, ha="center", va="center",
            fontsize=7.6, color="#334155", family=STYLE["font"], zorder=4
        )

    # Combined fragments (alt / opt / loop) — clean white card with dashed border & pastel tag
    if frames:
        for fr in frames:
            y_hi = msg_y(fr["start"]) + 0.74
            y_lo = msg_y(fr["end"]) - 0.42
            x_lo = xs[fr["col_start"]] - 0.85
            x_hi = xs[fr["col_end"]] + 0.85
            frame_edge = fr.get("border", STYLE["actor_edge"])
            frame_bg = fr.get("bg", "#FFFFFF")

            rect = patches.Rectangle(
                (x_lo, y_lo), x_hi - x_lo, y_hi - y_lo,
                facecolor=frame_bg, edgecolor=frame_edge,
                linewidth=1.1, linestyle="--", alpha=0.82, zorder=1
            )
            ax.add_patch(rect)

            # UML pentagon operator tag
            tag_w = 1.05
            tag_h = 0.34
            pent = patches.Polygon(
                [
                    (x_lo, y_hi),
                    (x_lo + tag_w, y_hi),
                    (x_lo + tag_w, y_hi - tag_h * 0.62),
                    (x_lo + tag_w - 0.16, y_hi - tag_h),
                    (x_lo, y_hi - tag_h),
                ],
                closed=True, facecolor=STYLE["actor_fill"], edgecolor=frame_edge,
                linewidth=1.1, zorder=2
            )
            ax.add_patch(pent)
            ax.text(
                x_lo + 0.12, y_hi - tag_h / 2, fr["kind"],
                ha="left", va="center", fontsize=8.0, fontweight="bold",
                color=STYLE["actor_edge"], family=STYLE["font"], zorder=3
            )
            ax.text(
                x_lo + tag_w + 0.14, y_hi - tag_h / 2, f"[{fr['guard']}]",
                ha="left", va="center", fontsize=7.9, fontweight="bold",
                color="#334155", family=STYLE["font"], zorder=3
            )

            if fr.get("else_at") is not None:
                y_div = msg_y(fr["else_at"]) + 0.50
                ax.plot(
                    [x_lo, x_hi], [y_div, y_div],
                    linestyle="--", linewidth=1.0, color=frame_edge, zorder=2
                )
                ax.text(
                    x_lo + 0.14, y_div - 0.28, f"[{fr.get('else_guard', 'else')}]",
                    ha="left", va="top", fontsize=7.8, style="italic",
                    color="#92400e", family=STYLE["font"], zorder=3,
                    bbox=dict(boxstyle="round,pad=0.2", facecolor="#fef3c7", edgecolor="none", alpha=0.9)
                )

    # Activation bars (soft indigo fill + indigo edge matching Member 2's palette)
    for i, msg in enumerate(messages):
        y = msg_y(i)
        for col in set([msg["from"], msg["to"]]):
            if col > 0:
                bar = patches.Rectangle(
                    (xs[col] - 0.075, y - 0.34), 0.15, 0.68,
                    facecolor=STYLE["actor_fill"], edgecolor=STYLE["actor_edge"],
                    linewidth=0.85, zorder=2
                )
                ax.add_patch(bar)

    # Messages & arrows (solid #334155 calls; dashed #0284c7 returns matching Member 2's <<include>>)
    for i, msg in enumerate(messages):
        y = msg_y(i)
        x1 = xs[msg["from"]]
        x2 = xs[msg["to"]]
        is_return = msg.get("kind", "sync") == "return"
        color = STYLE["return_arrow"] if is_return else STYLE["sync_arrow"]
        txt_color = STYLE["return_text"] if is_return else "#000000"
        ls = (0, (5, 3)) if is_return else "-"

        if x1 == x2:
            loop_w = 0.62
            ax.plot(
                [x1 + 0.08, x1 + loop_w, x1 + loop_w, x1 + 0.12],
                [y + 0.13, y + 0.13, y - 0.19, y - 0.19],
                color=color, linewidth=1.2, linestyle=ls, zorder=4
            )
            ax.annotate(
                "", xy=(x1 + 0.08, y - 0.19), xytext=(x1 + 0.28, y - 0.19),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.2), zorder=5
            )
            ax.text(
                x1 + loop_w + 0.10, y - 0.02, msg["label"],
                ha="left", va="center", fontsize=8.0, color=txt_color, family=STYLE["font"],
                bbox=dict(boxstyle="round,pad=0.14", facecolor="#FFFFFF", edgecolor="none", alpha=0.92),
                zorder=6
            )
        else:
            offset = 0.09 if x2 > x1 else -0.09
            arrow = FancyArrowPatch(
                (x1 + offset, y), (x2 - offset, y),
                arrowstyle="-|>" if not is_return else "->",
                mutation_scale=12,
                linewidth=1.25 if not is_return else 1.1,
                linestyle=ls,
                color=color,
                zorder=5
            )
            ax.add_patch(arrow)
            mid_x = (x1 + x2) / 2
            ax.text(
                mid_x, y + 0.17, msg["label"],
                ha="center", va="bottom", fontsize=8.1, color=txt_color, family=STYLE["font"],
                bbox=dict(boxstyle="round,pad=0.12", facecolor="#FFFFFF", edgecolor="none", alpha=0.92),
                zorder=6
            )

    out_path = os.path.join(OUT_DIR, filename)
    plt.tight_layout(pad=0.25)
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor="#FFFFFF")
    plt.close(fig)
    print(f"Generated {out_path}")


def draw_activity_diagram():
    """
    Draws a 4-swimlane UML Activity Diagram styled identically to Member 2's palette:
    - Outer dashed system boundary (#f8fafc / #64748b)
    - White swimlanes with #cbd5e1 borders and #e0e7ff / #3730a3 (and #fef3c7 / #92400e for SePay) headers
    - Mint green (#f0fdf4 / #166534) rounded action nodes matching Member 2's use case ellipses
    - Warm amber (#fef3c7 / #92400e) decision diamond
    - Solid #334155 control flows and dashed #0284c7 external/async callbacks
    """
    fig, ax = plt.subplots(figsize=(14.0, 9.6), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")
    ax.set_xlim(0, 14.2)
    ax.set_ylim(0, 10.4)
    ax.axis("off")

    # Outer dashed system boundary
    outer = patches.Rectangle(
        (0.15, 0.15), 13.9, 10.1,
        facecolor=STYLE["boundary_fill"], edgecolor=STYLE["boundary_edge"],
        linewidth=1.2, linestyle=(0, (6, 4)), zorder=0
    )
    ax.add_patch(outer)
    ax.text(
        7.10, 9.96,
        "End-to-End Hardware Purchase, SePay VietQR Payment and Order Fulfillment Activity Workflow",
        ha="center", va="center", fontsize=12.0, fontweight="bold",
        color="#000000", family=STYLE["font"], zorder=2
    )

    lanes = [
        (0.32, 3.25, "<<actor>>\nCustomer / Guest", STYLE["actor_fill"], STYLE["actor_edge"]),
        (3.67, 3.25, "<<boundary>>\nStorefront SPA (UI)", STYLE["entity_fill"], STYLE["entity_edge"]),
        (7.02, 3.55, "<<system>>\nBackend API & PostgreSQL", STYLE["actor_fill"], STYLE["actor_edge"]),
        (10.67, 3.21, "<<external / staff>>\nSePay VietQR & Staff", STYLE["external_fill"], STYLE["external_edge"]),
    ]

    for lx, lw, title, hfill, hedge in lanes:
        body = FancyBboxPatch(
            (lx, 0.32), lw, 8.70,
            boxstyle="round,pad=0.02,rounding_size=0.10",
            facecolor="#FFFFFF", edgecolor=STYLE["subcluster_edge"], linewidth=1.1, zorder=1
        )
        ax.add_patch(body)
        header = FancyBboxPatch(
            (lx, 9.02), lw, 0.64,
            boxstyle="round,pad=0.02,rounding_size=0.10",
            facecolor=hfill, edgecolor=hedge, linewidth=1.4, zorder=2
        )
        ax.add_patch(header)
        ax.text(
            lx + lw / 2, 9.34, title, ha="center", va="center",
            fontsize=8.8, color="#000000", family=STYLE["font"], linespacing=1.18, zorder=3
        )

    def action(x, y, text, w=2.72, h=0.68, fc=None, ec=None):
        box = FancyBboxPatch(
            (x - w / 2, y - h / 2), w, h,
            boxstyle="round,pad=0.04,rounding_size=0.22",
            facecolor=fc or STYLE["action_fill"],
            edgecolor=ec or STYLE["action_edge"],
            linewidth=1.3, zorder=3
        )
        ax.add_patch(box)
        ax.text(
            x, y, text, ha="center", va="center",
            fontsize=8.0, color="#000000", family=STYLE["font"], linespacing=1.18, zorder=4
        )

    def decision(x, y, text, w=1.55, h=0.86):
        poly = patches.Polygon(
            [(x, y + h / 2), (x + w / 2, y), (x, y - h / 2), (x - w / 2, y)],
            closed=True, facecolor=STYLE["external_fill"], edgecolor=STYLE["external_edge"],
            linewidth=1.4, zorder=3
        )
        ax.add_patch(poly)
        ax.text(
            x, y, text, ha="center", va="center",
            fontsize=7.8, fontweight="bold", color="#000000", family=STYLE["font"], zorder=4
        )

    def arrow(p1, p2, label="", lx=None, ly=None, dashed=False):
        color = STYLE["return_arrow"] if dashed else STYLE["sync_arrow"]
        tcolor = STYLE["return_text"] if dashed else "#334155"
        a = FancyArrowPatch(
            p1, p2,
            arrowstyle="-|>" if not dashed else "->",
            mutation_scale=11,
            linewidth=1.15,
            linestyle=(0, (5, 3)) if dashed else "-",
            color=color, zorder=4
        )
        ax.add_patch(a)
        if label:
            tx = lx if lx is not None else (p1[0] + p2[0]) / 2
            ty = ly if ly is not None else (p1[1] + p2[1]) / 2 + 0.14
            ax.text(
                tx, ty, label, ha="center", va="center", fontsize=7.6,
                color=tcolor, family=STYLE["font"],
                bbox=dict(boxstyle="round,pad=0.10", facecolor="#FFFFFF", edgecolor="none", alpha=0.92),
                zorder=5
            )

    c1, c2, c3, c4 = 1.945, 5.295, 8.795, 12.275

    # Initial node
    ax.add_patch(patches.Circle((c1, 8.66), 0.15, facecolor="#334155", edgecolor="#334155", zorder=4))

    # Lane 1: Customer
    action(c1, 7.82, "Browse Hardware Catalog\n& Apply Specs Filters\n(Socket, RAM, VRAM)")
    action(c1, 6.50, "Select SKU Variant &\nAdd Components to Cart")
    action(c1, 5.05, "Review Compatibility &\nSubmit Checkout Form\n(VietQR / ZaloPay / COD)")
    action(c1, 3.35, "Scan Dynamic SePay\nVietQR Code & Transfer\nExact Amount + Code")
    action(c1, 1.50, "Track Order Progress\n(Pending -> Completed)")

    # Lane 2: Storefront SPA
    action(c2, 7.82, "Generate Session UUID &\nPOST /api/visits\n(Conversion Tracking)")
    action(c2, 6.50, "POST /orders/cart/validate\nRender Stock Badges &\nPC Compatibility Banner")
    action(c2, 3.35, "Display SePay QR Modal\n(30m Timer + 3s Polling\n/payment-status)")
    action(c2, 1.50, "Update Order Stepper UI\n& Show Confirmation Toast")

    # Lane 3: Backend & PostgreSQL
    action(c3, 6.50, "Query Live Stock & Specs\nCheck Socket / RAM / PSU\nCompute Server Totals", fc=STYLE["entity_fill"], ec=STYLE["entity_edge"])
    decision(c3, 5.05, "Payment\nMethod?")
    action(c3, 3.72, "Create Order (Pending)\nSave orders.session_id\nBuild SePay QR Payload", fc=STYLE["entity_fill"], ec=STYLE["entity_edge"])
    action(c3, 2.40, "Atomic DB Transaction:\nSELECT FOR UPDATE,\nDeduct Stock & Log Sale", fc=STYLE["entity_fill"], ec=STYLE["entity_edge"])
    action(c3, 1.08, "Re-evaluate Low-Stock\nAlerts & Refresh Admin\nRevenue Dashboard KPIs", fc=STYLE["entity_fill"], ec=STYLE["entity_edge"])

    # Lane 4: SePay & Staff
    action(c4, 5.05, "COD Path:\nSet Status = 'Packing'\nImmediately", fc=STYLE["actor_fill"], ec=STYLE["actor_edge"])
    action(c4, 3.35, "SePay Detects Transfer\nPOST /payment/sepay-webhook\n(Authorization: Apikey)", fc=STYLE["external_fill"], ec=STYLE["external_edge"])
    action(c4, 2.05, "Verify Apikey, Amount &\nCSORDER<id> Match;\nMark Status = 'Paid'", fc=STYLE["external_fill"], ec=STYLE["external_edge"])
    action(c4, 0.88, "Staff Fulfillment Pipeline:\nPacking -> Shipped ->\nCompleted", fc=STYLE["action_fill"], ec=STYLE["action_edge"])

    # Final node (bullseye)
    ax.add_patch(patches.Circle((c1, 0.64), 0.18, facecolor="#FFFFFF", edgecolor="#334155", linewidth=1.5, zorder=4))
    ax.add_patch(patches.Circle((c1, 0.64), 0.10, facecolor="#334155", edgecolor="#334155", zorder=5))

    # Control flows
    arrow((c1, 8.51), (c1, 8.16))
    arrow((c1 + 1.36, 7.82), (c2 - 1.36, 7.82))
    arrow((c1, 7.48), (c1, 6.84))
    arrow((c1 + 1.36, 6.50), (c2 - 1.36, 6.50))
    arrow((c2 + 1.36, 6.50), (c3 - 1.36, 6.50))
    arrow((c1, 6.16), (c1, 5.39))
    arrow((c1 + 1.36, 5.05), (c3 - 0.78, 5.05), label="POST /api/orders/checkout", lx=5.30, ly=5.24)
    arrow((c3 + 0.78, 5.05), (c4 - 1.36, 5.05), label="[COD]", lx=10.22, ly=5.23)
    arrow((c3, 4.62), (c3, 4.06), label="[VietQR / ZaloPay]", lx=9.72, ly=4.34, dashed=True)
    arrow((c3 - 1.36, 3.72), (c2 + 1.36, 3.45))
    arrow((c2 - 1.36, 3.35), (c1 + 1.36, 3.35))

    # Bank transfer async dashed path to SePay
    ax.plot([c1, c1, c4, c4], [3.01, 2.74, 2.74, 3.01], color=STYLE["return_arrow"], lw=1.1, ls=(0, (5, 3)), zorder=2)
    ax.annotate("", xy=(c4, 3.01), xytext=(c4, 2.82),
                arrowprops=dict(arrowstyle="->", color=STYLE["return_arrow"], lw=1.15), zorder=5)
    ax.text(c2, 2.85, "<<transfer>> NAPAS 24/7 Bank Transfer", ha="center", va="center",
            fontsize=7.6, color=STYLE["return_text"], family=STYLE["font"],
            bbox=dict(boxstyle="round,pad=0.08", facecolor="#FFFFFF", edgecolor="none"), zorder=5)

    arrow((c4, 3.01), (c4, 2.39))
    arrow((c4 - 1.36, 2.12), (c3 + 1.36, 2.34), dashed=True)

    # COD path straight to atomic deduction
    ax.plot([c4, c4, 10.35, c3 + 1.36], [4.71, 4.25, 4.25, 2.58], color=STYLE["actor_edge"], lw=1.05, ls=":", zorder=2)

    arrow((c3, 2.06), (c3, 1.42))
    arrow((c3 + 1.36, 1.00), (c4 - 1.36, 0.90))
    arrow((c3 - 1.36, 1.24), (c2 + 1.36, 1.44), dashed=True)
    arrow((c2 - 1.36, 1.50), (c1 + 1.36, 1.50))
    arrow((c1, 1.16), (c1, 0.82))

    out_path = os.path.join(OUT_DIR, "act_order_payment.png")
    plt.tight_layout(pad=0.25)
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor="#FFFFFF")
    plt.close(fig)
    print(f"Generated {out_path}")


if __name__ == "__main__":
    # 1. Figure 5.3: Auth & RBAC Sequence Diagram
    draw_sequence_diagram(
        "seq_auth_rbac.png",
        "Sequence Diagram: User Authentication and JWT / RBAC Authorization (UC-01, UC-02)",
        participants=[
            ("<<actor>>\nUser\n(Admin / Customer)", "actor"),
            ("<<boundary>>\nWeb Client\n(SPA)", "entity"),
            ("<<control>>\nAuth / Admin\nRouter", "entity"),
            ("<<service>>\nAuthService &\nRBAC Guard", "actor"),
            ("<<database>>\nPostgreSQL\n(users, roles)", "action"),
        ],
        messages=[
            {"from": 0, "to": 1, "label": "1: enterCredentials(username/email, password)"},
            {"from": 1, "to": 2, "label": "2: POST /api/auth/login { identifier, password }"},
            {"from": 2, "to": 3, "label": "3: login(identifier, password)"},
            {"from": 3, "to": 4, "label": "4: SELECT u.*, r.role_name FROM users JOIN roles"},
            {"from": 4, "to": 3, "label": "5: <<return>> userRecord (password_hash, is_active, role)", "kind": "return"},
            {"from": 3, "to": 3, "label": "6: bcrypt.compare() & check is_active"},
            {"from": 3, "to": 4, "label": "7: UPDATE users SET last_login_at = NOW()"},
            {"from": 3, "to": 1, "label": "8: <<return>> HTTP 200 { token: JWT(userId, role), user }", "kind": "return"},
            {"from": 1, "to": 2, "label": "9: GET /api/admin/dashboard (Authorization: Bearer JWT)"},
            {"from": 2, "to": 3, "label": "10: authenticate() & authorize('Admin')"},
            {"from": 3, "to": 2, "label": "11: <<return>> next() -> HTTP 200 Dashboard KPIs", "kind": "return"},
            {"from": 3, "to": 1, "label": "12: <<return>> HTTP 403 Forbidden (Insufficient Role)", "kind": "return"},
        ],
        frames=[
            {"kind": "alt", "guard": "Credentials Valid & is_active == true", "start": 5, "end": 7, "col_start": 1, "col_end": 4, "bg": "#f0fdf4", "border": "#166534"},
            {"kind": "alt", "guard": "role == 'Admin'", "else_at": 11, "else_guard": "role != 'Admin'", "start": 9, "end": 11, "col_start": 1, "col_end": 3, "bg": "#ffffff", "border": "#3730a3"},
        ],
        figsize=(13.5, 9.2),
    )

    # 2. Figure 5.4: Multi-Criteria Specs Filter & Cart Validation Sequence Diagram
    draw_sequence_diagram(
        "seq_catalog_cart.png",
        "Sequence Diagram: Multi-Criteria Hardware Specs Filtering & Cart Compatibility Validation (UC-05, UC-08)",
        participants=[
            ("<<actor>>\nCustomer /\nGuest", "actor"),
            ("<<boundary>>\nStorefront\nSPA", "entity"),
            ("<<control>>\nProduct / Order\nController", "entity"),
            ("<<service>>\nProduct / Order\nService", "actor"),
            ("<<database>>\nPostgreSQL\n(products, specs)", "action"),
        ],
        messages=[
            {"from": 0, "to": 1, "label": "1: openStorefrontCatalog()"},
            {"from": 1, "to": 2, "label": "2: POST /api/visits { sessionId: UUID }"},
            {"from": 2, "to": 4, "label": "3: UPSERT website_visits (session_id)"},
            {"from": 0, "to": 1, "label": "4: applyFilters(Category=CPU, spec_Socket=LGA1700, inStock=true)"},
            {"from": 1, "to": 2, "label": "5: GET /api/products?category=CPU&spec_Socket=LGA1700"},
            {"from": 2, "to": 3, "label": "6: listProducts(filters)"},
            {"from": 3, "to": 4, "label": "7: SELECT products + JSON_AGG(variants, specs) WHERE EXISTS(...)"},
            {"from": 4, "to": 1, "label": "8: <<return>> HTTP 200 { products[], pagination }", "kind": "return"},
            {"from": 0, "to": 1, "label": "9: addHardwareSKUsToCart() & openCart()"},
            {"from": 1, "to": 2, "label": "10: POST /api/orders/cart/validate { items[] }"},
            {"from": 2, "to": 3, "label": "11: validateCartAndCompatibility(items)"},
            {"from": 3, "to": 4, "label": "12: fetchLiveStockPriceAndSpecs(variantIds)"},
            {"from": 3, "to": 3, "label": "13: evaluateCompatibility(Socket, RAM, PSU)"},
            {"from": 3, "to": 1, "label": "14: <<return>> HTTP 200 { valid, totalAmount, stockErrors, compatibility }", "kind": "return"},
        ],
        frames=[
            {"kind": "opt", "guard": "First Visit in Browser Session", "start": 1, "end": 2, "col_start": 1, "col_end": 4, "bg": "#f0fdf4", "border": "#166534"},
            {"kind": "alt", "guard": "Requested Qty <= Live Stock", "start": 10, "end": 13, "col_start": 1, "col_end": 4, "bg": "#ffffff", "border": "#3730a3"},
        ],
        figsize=(13.8, 10.0),
    )

    # 3. Figure 5.5: Online Checkout via SePay VietQR, Webhook & Atomic Stock Deduction
    draw_sequence_diagram(
        "seq_checkout_sepay.png",
        "Sequence Diagram: Online Checkout via SePay VietQR, Webhook Callback & Atomic Stock Deduction (UC-09, UC-10)",
        participants=[
            ("<<actor>>\nRetail\nCustomer", "actor"),
            ("<<boundary>>\nStorefront\nCheckout UI", "entity"),
            ("<<service>>\nOrder & Payment\nService", "actor"),
            ("<<external>>\nSePay Gateway\n(qr.sepay.vn)", "external"),
            ("<<repository>>\nInventoryRepo\n(FOR UPDATE)", "entity"),
            ("<<database>>\nPostgreSQL\nDatabase", "action"),
        ],
        messages=[
            {"from": 0, "to": 1, "label": "1: submitCheckout(VietQR, shippingInfo)"},
            {"from": 1, "to": 2, "label": "2: POST /api/orders/checkout { items, paymentMethod:'VietQR', sessionId }"},
            {"from": 2, "to": 5, "label": "3: BEGIN; ensure website_visits; INSERT orders(Pending) & order_items; COMMIT"},
            {"from": 2, "to": 1, "label": "4: <<return>> HTTP 201 { order, payment: { qrUrl: qr.sepay.vn, des: CSORDER# } }", "kind": "return"},
            {"from": 1, "to": 0, "label": "5: <<display>> SePay Dynamic VietQR Modal + 30m Timer", "kind": "return"},
            {"from": 0, "to": 3, "label": "6: scanVietQRAndTransferExactAmount()"},
            {"from": 3, "to": 2, "label": "7: POST /api/payment/sepay-webhook (Authorization: Apikey <KEY>)"},
            {"from": 2, "to": 2, "label": "8: verifyApikey(timingSafeEqual) & matchOrder(CSORDER#, amount)"},
            {"from": 2, "to": 5, "label": "9: BEGIN; SELECT orders FOR UPDATE (status == 'Pending')"},
            {"from": 2, "to": 4, "label": "10: deductStockForOrder(client, orderItems, userId)"},
            {"from": 4, "to": 5, "label": "11: FOR UPDATE; stock -= qty; INSERT Sale log"},
            {"from": 2, "to": 5, "label": "12: UPDATE orders SET status='Paid'; COMMIT; checkLowStockAlerts()"},
            {"from": 2, "to": 3, "label": "13: <<return>> HTTP 200 { matched: true, status: 'Paid' }", "kind": "return"},
            {"from": 1, "to": 2, "label": "14: poll GET /api/orders/:id/payment-status"},
            {"from": 2, "to": 1, "label": "15: <<return>> HTTP 200 { paid: true, status: 'Paid' } -> Order Tracking", "kind": "return"},
        ],
        frames=[
            {"kind": "alt", "guard": "Apikey Valid & Exact Amount Match & Status == Pending", "start": 7, "end": 12, "col_start": 2, "col_end": 5, "bg": "#fef3c7", "border": "#92400e"},
            {"kind": "loop", "guard": "Every 3s until paid or timeout", "start": 13, "end": 14, "col_start": 1, "col_end": 2, "bg": "#f0fdf4", "border": "#166534"},
        ],
        figsize=(14.2, 10.8),
    )

    # 4. Figure 5.6: Activity Diagram
    draw_activity_diagram()
