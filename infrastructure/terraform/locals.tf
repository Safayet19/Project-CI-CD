locals {
  project_name  = lower(replace(var.platform_name, " ", "-"))
  resource_name = "${local.project_name}-dev"
}