variable "aws_region" {

  description = "Aws region for our infrastructure"
  type        = string
  default     = "ap-southeast-2"
}

variable "platform_name" {
  type    = string
  default = "Default Platform"
}