(() => {
  const prefix = "/__visual-tuner";
  const params = new URLSearchParams(location.search);
  const create = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  const boot = async () => {
    if (document.querySelector("visual-tuner")) return;
    const response = await fetch(`${prefix}/config`);
    if (!response.ok) return;
    const { schema, approved } = await response.json();
    if (params.get(schema.query_parameter || "tune") !== "1") return;
    const controls = schema.groups.flatMap((group) => group.controls);
    const storageKey = `visual-tuner:${schema.id}`;
    const stored = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; } })();
    const values = { ...Object.fromEntries(controls.map((control) => [control.id, control.default])), ...(approved.values || {}), ...stored };

    const host = create("visual-tuner");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      :host{position:fixed;z-index:2147483000;top:12px;right:12px;width:min(370px,calc(100vw - 24px));max-height:calc(100svh - 24px);overflow:auto;background:#111;color:#f3f3f3;border:1px solid #444;box-shadow:0 18px 60px #0008;font:11px/1.35 ui-monospace,monospace}*{box-sizing:border-box}header,footer{position:sticky;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;background:#111;border-bottom:1px solid #3a3a3a}header{top:0}footer{bottom:0;border-top:1px solid #3a3a3a;border-bottom:0;flex-wrap:wrap}.group{border-bottom:1px solid #333}.group>strong{display:block;padding:9px 12px;background:#202020;color:#bbb;text-transform:uppercase}.control{display:grid;gap:7px;padding:10px 12px;border-top:1px solid #292929}.label{display:flex;gap:6px}.label output{margin-left:auto;color:#9ee7a7}button,select,input,textarea{font:inherit;color:inherit;background:#171717;border:1px solid #4b4b4b}button{min-height:32px;padding:0 9px;cursor:pointer}button.primary{background:#ff3d1f;border-color:#ff3d1f}select,textarea,input[type=text]{width:100%;min-height:34px;padding:6px}textarea{resize:vertical}input[type=range]{width:100%;accent-color:#ff3d1f}.status{min-height:1.3em;padding:0 12px 10px;color:#9ee7a7}.hint{color:#888;font-size:10px}.order{display:grid;gap:4px}.order button{text-align:left}.order button[data-selected=true]{border-color:#ff3d1f}@media(max-width:600px){:host{top:6px;right:6px;width:calc(100vw - 12px);max-height:calc(100svh - 12px)}}</style>`;
    const panel = create("div");
    const header = create("header");
    header.append(create("strong", schema.title), create("span", "DEV ONLY", "hint"));
    panel.append(header);
    const inputs = new Map();

    const apply = (control, value) => {
      if (control.target.css_variable) document.documentElement.style.setProperty(control.target.css_variable, `${value}${control.unit || ""}`);
      if (control.target.class_name) document.body.classList.toggle(control.target.class_name, Boolean(value));
      if (control.target.preview_id && ["text", "text-lines"].includes(control.kind)) {
        const target = document.querySelector(`[data-tune-id="${CSS.escape(control.target.preview_id)}"]`);
        if (target) {
          if (Array.isArray(value)) {
            const nodes=[];
            value.forEach((line,index)=>{if(index)nodes.push(document.createElement("br"));nodes.push(document.createTextNode(line));});
            target.replaceChildren(...nodes);
          }
          else target.textContent = String(value);
        }
      }
      if (control.target.event_name) window.dispatchEvent(new CustomEvent(control.target.event_name, { detail: { value } }));
      if (control.kind === "section-order") window.dispatchEvent(new CustomEvent("visual-tuner:section-order", { detail: { id: control.id, value } }));
    };

    for (const group of schema.groups) {
      const section = create("section", undefined, "group");
      section.append(create("strong", group.label));
      for (const control of group.controls) {
        const wrap = create(control.kind === "section-order" ? "div" : "label", undefined, "control");
        const label = create("span", control.label, "label");
        const output = create("output", ""); label.append(output); wrap.append(label);
        wrap.append(create("small", control.rationale, "hint"));
        let input;
        if (control.kind === "range") {
          input = create("input"); input.type="range"; input.min=control.min; input.max=control.max; input.step=control.step;
        } else if (control.kind === "select") {
          input=create("select"); control.options.forEach((option)=>input.add(new Option(option.label,option.value)));
        } else if (control.kind === "boolean") {
          input=create("input"); input.type="checkbox";
        } else if (["text","text-lines"].includes(control.kind)) {
          input=control.kind === "text" ? create("input") : create("textarea"); if(control.kind === "text") input.type="text"; input.maxLength=control.max_length;
        } else {
          input=create("div"); input.className="order";
        }
        const renderOrder = (value) => {
          input.replaceChildren();
          value.forEach((item, index) => {
            const row=create("div"); row.style.display="grid"; row.style.gridTemplateColumns="1fr auto auto"; row.style.gap="4px";
            const option=control.options.find((candidate)=>candidate.value===item);
            row.append(create("span", option?.label || item));
            const up=create("button","↑"); const down=create("button","↓");
            up.type=down.type="button"; up.disabled=index===0; down.disabled=index===value.length-1;
            const move=(to)=>{const next=[...value];[next[index],next[to]]=[next[to],next[index]];values[control.id]=next;apply(control,next);localStorage.setItem(storageKey,JSON.stringify(values));setInput(next)};
            up.onclick=()=>move(index-1); down.onclick=()=>move(index+1); row.append(up,down); input.append(row);
          });
        };
        const setInput = (value) => { if(control.kind==="section-order")renderOrder(value); else if(input.type === "checkbox") input.checked=Boolean(value); else input.value=Array.isArray(value)?value.join("\n"):String(value ?? ""); output.textContent=control.kind==="range"?`${value}${control.unit||""}`:""; };
        const readInput = () => { if(control.kind==="range")return Number(input.value); if(control.kind==="boolean")return input.checked; if(control.kind==="text-lines")return input.value.split("\n").map((line)=>line.trim()).filter(Boolean); if(control.kind==="section-order")return values[control.id]; return input.value; };
        setInput(values[control.id]); apply(control, values[control.id]); inputs.set(control.id,{control,input,setInput,readInput});
        if(control.kind!=="section-order")input.addEventListener(control.kind==="boolean"||control.kind==="select"?"change":"input",()=>{values[control.id]=readInput();apply(control,values[control.id]);localStorage.setItem(storageKey,JSON.stringify(values));setInput(values[control.id])});
        wrap.append(input); section.append(wrap);
      }
      panel.append(section);
    }
    const status=create("p","","status");
    const footer=create("footer");
    const reset=create("button","Reset"); const copy=create("button","Copy JSON"); const save=create("button","Save draft","primary");
    reset.onclick=()=>{localStorage.removeItem(storageKey);location.reload()};
    copy.onclick=async()=>{await navigator.clipboard.writeText(JSON.stringify({schema:schema.id,values},null,2));status.textContent="Copied."};
    save.onclick=async()=>{const result=await fetch(`${prefix}/save`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({schema:schema.id,values})});const body=await result.json();status.textContent=body.ok?"Draft saved to project.":body.error||"Save failed."};
    footer.append(reset,copy,save); panel.append(footer,status); root.append(panel); document.body.append(host);
  };
  boot().catch((error) => console.warn("Visual tuner unavailable", error));
})();
