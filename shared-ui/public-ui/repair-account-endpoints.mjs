export function repairAccountEndpoints(source) {
  const bundled = source.includes('var RPC_NAMES = /* @__PURE__ */ new Set([');
  const replacements = bundled ? [
    [
      'var RPC_NAMES = /* @__PURE__ */ new Set(["uhz_resource_collaboration",',
      'var RPC_NAMES = /* @__PURE__ */ new Set(["uhz_inft_coin_status", "uhz_economy_my_dashboard", "uhz_header_account_summary", "uhz_resource_collaboration",'
    ],
    [
      'if (method === "POST" && ["uhz_eco_catalog", "uhz_eco_public_free"].includes(rpcName)) {',
      'if (method === "POST" && ["uhz_eco_catalog", "uhz_eco_public_free", "uhz_inft_coin_status"].includes(rpcName)) {'
    ],
    [
      'JSON.stringify(rpcName === "uhz_eco_catalog" ? {} : { p_content_id: String(publicBody.p_content_id) })',
      'JSON.stringify(rpcName === "uhz_eco_public_free" ? { p_content_id: String(publicBody.p_content_id) } : {})'
    ]
  ] : [
    [
      "const RPC_NAMES = new Set(['uhz_resource_collaboration',",
      "const RPC_NAMES = new Set(['uhz_inft_coin_status','uhz_economy_my_dashboard','uhz_header_account_summary','uhz_resource_collaboration',"
    ],
    [
      "if(method==='POST'&&['uhz_eco_catalog','uhz_eco_public_free'].includes(rpcName)){",
      "if(method==='POST'&&['uhz_eco_catalog','uhz_eco_public_free','uhz_inft_coin_status'].includes(rpcName)){"
    ],
    [
      "JSON.stringify(rpcName==='uhz_eco_catalog'?{}:{p_content_id:String(publicBody.p_content_id)})",
      "JSON.stringify(rpcName==='uhz_eco_public_free'?{p_content_id:String(publicBody.p_content_id)}:{})"
    ]
  ];
  for (const [before, after] of replacements) {
    if (source.includes(after)) continue;
    const index = source.indexOf(before);
    if (index === -1 || index !== source.lastIndexOf(before)) {
      throw new Error('The community Worker gateway differs from the expected source.');
    }
    source = source.slice(0, index) + after + source.slice(index + before.length);
  }
  return source;
}
