resource "cloudflare_zero_trust_access_policy" "allow_owner" {
  account_id       = var.account_id
  name             = "allow-owner"
  decision         = "allow"
  session_duration = "730h"

  include = [
    {
      email = {
        email = var.allowed_email
      }
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "memo" {
  account_id       = var.account_id
  name             = "memo"
  type             = "self_hosted"
  domain           = var.app_domain
  session_duration = "730h"

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.allow_owner.id
      precedence = 1
    }
  ]
}
