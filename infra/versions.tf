terraform {
  required_version = ">= 1.9"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # stateはCloudflare R2 (S3互換) に保存
  # 認証はAWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY環境変数で行う (R2 APIトークン)
  backend "s3" {
    bucket = "memo-tfstate"
    key    = "terraform.tfstate"
    region = "auto"
    endpoints = {
      s3 = "https://61cf1276a92f9ee1f177edc44528c1f9.r2.cloudflarestorage.com"
    }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

# 認証はCLOUDFLARE_API_TOKEN環境変数で行う
provider "cloudflare" {}
