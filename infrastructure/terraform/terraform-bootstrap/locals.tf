locals {
  bucket_prefix = "${lower(replace(var.platform_name, " ", "-"))}-tfstate-"
}