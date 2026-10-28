terraform {
  backend "s3" {
    bucket       = "my-personal-world-tfstate-7f987cc388eb8a910e81566eb9"
    key          = "ec2/terraform.tfstate"
    region       = "ap-southeast-2"
    encrypt      = true
    use_lockfile = true
  }
}