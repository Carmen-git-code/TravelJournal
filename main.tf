# ==============================================================================
# TRAVEL JOURNAL - INFRASTRUCTURE AS CODE (TERRAFORM)
# The Foundation
# ==============================================================================

# AWS
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "db_password" {
  description = "The master password for the RDS database"
  type        = string
  sensitive   = true
}

# VPC
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "Travel-Journal-VPC"
    Environment = "Production"
  }
}

# IGW
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = {
    Name = "Travel-Journal-IGW"
  }
}

# Subnets - Public
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-2"
  }
}

# Route Tables - Public subnets
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

# ==============================================================================
# Security Groups & Private Database Subnets
# ==============================================================================

# Subnets - Private
resource "aws_subnet" "private_db_subnet_1" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "Travel-Journal-Private-DB-1"
  }
}

resource "aws_subnet" "private_db_subnet_2" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "Travel-Journal-Private-DB-2"
  }
}

# Security Groups

# ALB Security Group (Internet facing)
resource "aws_security_group" "alb_sg" {
  name        = "travel-journal-alb-sg"
  description = "Allow HTTP inbound traffic from the internet"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Application Security Group
resource "aws_security_group" "app_sg" {
  name        = "travel-journal-app-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "travel-journal-db-sg"
  description = "Allow MySQL traffic from App instances only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "MySQL from App SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==============================================================================
# The Data Tier (Amazon RDS)
# ==============================================================================

# DB subnet group
resource "aws_db_subnet_group" "travel_journal_db_subnet_group" {
  name       = "travel-journal-db-subnet-group"
  subnet_ids = [aws_subnet.private_db_subnet_1.id, aws_subnet.private_db_subnet_2.id]

  tags = {
    Name = "Travel Journal DB Subnet Group"
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "travel_journal_db" {
  identifier             = "travel-journal-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = "travel_journal_db"
  username               = "admin" # Master username
  password               = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.travel_journal_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "Travel-Journal-MySQL-DB"
  }
}

# Output DB Endpoint
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.travel_journal_db.endpoint
}
