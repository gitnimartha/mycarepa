terraform {}

include "root" {
  path = find_in_parent_folders()
}

locals {
  common_vars    = yamldecode(file(find_in_parent_folders("common_vars.yaml")))
  generated_vars = yamldecode(file(find_in_parent_folders("generated_vars.yaml")))
  workspace      = get_env("TG_WORKSPACE", "mycarepa")
}

inputs = {
  task_family       = "${local.workspace}-task"
  container_name    = "${local.workspace}-container"
  service_name      = "${local.workspace}-service"
  target_group_name = "${local.workspace}-tg"

  default_tags = merge(
    local.common_vars.default_tags,
    local.generated_vars.default_tags,
    {
      planFolder  = "mycarepa"
      projectName = "MyCarePA"
    }
  )
}
