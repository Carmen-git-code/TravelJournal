# ==============================================================================
# TRAVEL JOURNAL - INFRASTRUCTURE AS CODE (TERRAFORM)
# Phase 1: The Networking Foundation
# ==============================================================================

# 1. Define the Cloud Provider (AWS)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Update this to your preferred region (e.g., us-west-2)
}

# 2. Create the Virtual Private Cloud (VPC)
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "Travel-Journal-VPC"
    Environment = "Production"
  }
}

# 3. Create the Internet Gateway (Allows internet access to the VPC)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = {
    Name = "Travel-Journal-IGW"
  }
}

# 4. Create Two Public Subnets (For High Availability across 2 AZs)
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-2"
  }
}

# 5. Create a Route Table and associate it with the Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "Travel-Journal-Public-RT"
  }
}

resource "aws_route_table_association" "public_rt_assoc_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rt_assoc_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}