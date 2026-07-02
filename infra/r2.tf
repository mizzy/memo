resource "cloudflare_r2_bucket" "images" {
  account_id = var.account_id
  name       = "memo-images"
  location   = "APAC"
}
