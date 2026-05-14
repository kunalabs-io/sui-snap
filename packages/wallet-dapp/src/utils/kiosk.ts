export const ORIGINBYTE_KIOSK_MODULE =
  '0x95a441d389b07437d00dd07e0b6f05f513d7659b13fd7c5d3923c7d9d847199b::ob_kiosk'

export const ORIGINBYTE_KIOSK_OWNER_TOKEN = `${ORIGINBYTE_KIOSK_MODULE}::OwnerToken`

// Shape we accept from the core API's `Object<{json: true}>`. The json view
// of the OwnerToken Move struct can use any of `for` / `kiosk` / `cap.fields.for`
// depending on the originbyte kiosk variant.
interface OwnerCapJson {
  for?: string
  kiosk?: string
  cap?: { fields: { for: string } }
}

export function getKioskIdFromOwnerCap(json: Record<string, unknown> | null | undefined): string {
  if (!json) return ''
  const fields = json as OwnerCapJson
  return fields.for ?? fields.kiosk ?? fields.cap?.fields.for ?? ''
}
