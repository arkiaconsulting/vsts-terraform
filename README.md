# Introduction
This Vsts extension simplifies the process of running terraform commands during your build process. It's written in Node.js, so that it runs quicker than Powershell, and independently of the build agent Os.

This extension is still at preview state. We need your feedback !

# Screenshot
![screenshot](https://raw.githubusercontent.com/arkiaconsulting/vsts-terraform/master/screenshot.png)

# Available tasks

## Terraform Download
This task will download the given terraform version into the given directory.

## Terraform Init
This task will launch a terraform init command. You will optionally be able to:
- use an AzureRM connection
- use your remote backend

## Terraform Plan
This task will launch a terraform plan command. You will optionally be able to:
- use an AzureRM connection
- use a specific terraform variables file
- specify custom variable values

## Terraform Apply
This task will launch a terraform apply command. You will optionally be able to:
- use an AzureRM connection

## Terraform Output
This task will launch a terraform apply command. You will optionally be able to:
- use an AzureRM connection
- save multiple terraform outputs to task variables

# Extra Links
[Hashicorp terraforms](https://www.terraform.io/)