import {
  to = aws_instance.spring_boot
  id = "i-0ae13516803892e8d"
}

import {
  id = "my-personal-world-storage"
  to = aws_s3_bucket.app_storage
}