/** Admin wording for the Service entity per business category (matches admin-nav.ts). */
export function serviceLabels(categoryKey: string) {
  if (categoryKey === "law") return { plural: "Practice areas", singular: "Practice area", pricing: false };
  if (categoryKey === "printing") return { plural: "Printing services", singular: "Printing service", pricing: true };
  if (categoryKey === "travel") return { plural: "Visa & other services", singular: "Service", pricing: true };
  return { plural: "Services", singular: "Service", pricing: true };
}
