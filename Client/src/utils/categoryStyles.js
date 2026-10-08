export const getCategoryStyle = (category) => {
  const normalized = category ? category.toLowerCase().trim() : "default";
  const styles = {
    agriculture: "bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/70",
    "trade services": "bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100/70",
    hospitality: "bg-orange-50 text-orange-900 border-orange-200/90 hover:bg-orange-100/70",
    "logistics & transport": "bg-sky-50 text-sky-900 border-sky-200/90 hover:bg-sky-100/70",
    "cleaning services": "bg-purple-50 text-purple-900 border-purple-200/90 hover:bg-purple-100/70",
    retail: "bg-pink-50 text-pink-900 border-pink-200/90 hover:bg-pink-100/70",
    landscaping: "bg-teal-50 text-teal-900 border-teal-200/90 hover:bg-teal-100/70",
    electrical: "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100",
    plumbing: "bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100",
    carpentry: "bg-stone-50 text-stone-900 border-stone-300 hover:bg-stone-100",
    default: "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100",
  };
  return styles[normalized] || styles.default;
};
