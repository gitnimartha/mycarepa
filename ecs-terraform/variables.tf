variable "vpc_id" {
  type    = string
  default = "vpc-092a09bb10e21849d"
}

variable "cluster_name" {
  type    = string
  default = "legalmatch-www1-cluster"
}

variable "load_balancer" {
  type    = string
  default = "wsa-20240308043857786000000d"
}

variable "host_name" {
  type    = string
  default = "mycarepa1.aws.legalmatch.com"
}

variable "priority" {
  type    = number
  default = 49339
}

variable "task_family" {
  type = string
}

variable "container_name" {
  type = string
}

variable "container_image" {
  type    = string
  default = ""
}

variable "service_name" {
  type = string
}

variable "target_group_name" {
  type = string
}
