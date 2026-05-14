module "mycarepa" {
  source = "../modules/ecs-app"

  vpc_id            = var.vpc_id
  cluster_name      = var.cluster_name
  target_group_name = var.target_group_name
  service_name      = var.service_name
  load_balancer     = var.load_balancer
  host_name         = var.host_name
  task_family       = var.task_family
  container_name    = var.container_name
  container_image   = var.container_image
  priority          = var.priority

  cpu    = "256"
  memory = "512"

  environment_vars = {
    NODE_ENV = "production"
    PORT     = "80"
  }
}
