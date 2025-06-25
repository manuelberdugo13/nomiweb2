from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import threading
import time



###* table communs  ###############*


class Year(models.Model):
    """Año calendario"""
    year = models.IntegerField(unique=True)

    def __str__(self):
        return str(self.year)

    class Meta:
        db_table = 'years'


class AbsenceType(models.Model):
    """Tipo de ausencia laboral"""
    name = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name or "Unnamed Absence"

    class Meta:
        db_table = 'absencestype'
        
        
        
class City(models.Model):
    """Ciudades y departamentos"""
    name = models.CharField(max_length=50)
    department = models.CharField(max_length=50)
    city_code = models.CharField(max_length=10)
    department_code = models.CharField(max_length=10)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'cities'
        
        
class Country(models.Model):
    """Listado de países"""
    name = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'countries'

class SocialSecurityEntity(models.Model):
    """Entidades de seguridad social"""
    code = models.CharField(max_length=9)
    tax_id = models.CharField(max_length=12)
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20)
    sgp_code = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'social_security_entities'
        
        
class Bank(models.Model):
    """Bancos nacionales e internacionales"""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    ach_code = models.CharField(max_length=255, blank=True, null=True)
    check_digit = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=255, blank=True, null=True)
    account_current = models.CharField(max_length=255)
    account_savings = models.CharField(max_length=255)
    office = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'banks'
        
        
class DocumentType(models.Model):
    """Tipos de documento de identificación"""
    name = models.CharField(max_length=50, blank=True, null=True)
    code = models.CharField(max_length=4, blank=True, null=True)
    dian_code = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'document_types'


class StructureLevel(models.Model):
    """Niveles jerárquicos en una organización"""
    name = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name or "Unnamed Level"

    class Meta:
        db_table = 'structure_levels'

class Position(models.Model):
    """Cargos laborales"""
    name = models.CharField(max_length=50)
    structure_level = models.ForeignKey(StructureLevel, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)
    company = models.ForeignKey('Company', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        db_table = 'positions'


class ContractType(models.Model):
    """Tipos de contrato laboral"""
    name = models.CharField(max_length=255, blank=True, null=True)
    dian_code = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'contract_types'


class PayrollType(models.Model):
    """Tipos de nómina"""
    name = models.CharField(max_length=255)
    dian_code = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'payroll_types'
        
        
class WorkCenter(models.Model):
    """Centro de trabajo asociado a un contrato"""
    name = models.CharField(max_length=30)
    arl_rate = models.DecimalField(max_digits=5, decimal_places=3)
    previous_center = models.CharField(max_length=30, blank=True, null=True)
    company = models.ForeignKey('Company', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        db_table = 'work_centers'

class ContributorType(models.Model):
    """Tipos de cotizantes para seguridad social"""
    code = models.CharField(primary_key=True, max_length=2)
    description = models.CharField(max_length=120, blank=True, null=True)
    plan_code = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.code

    class Meta:
        db_table = 'contributor_types'

class SubtypeContributor(models.Model):
    """Subtipos de cotizantes"""
    code = models.CharField(primary_key=True, max_length=2)
    description = models.CharField(max_length=100, blank=True, null=True)
    plan_code = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.description

    class Meta:
        db_table = 'subtype_contributors'

class SalaryType(models.Model):
    """Tipos de salario"""
    name = models.CharField(max_length=40, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'salary_types'


class CostCenter(models.Model):
    """Centros de costo contable"""
    name = models.CharField(max_length=30, blank=True, null=True)
    accounting_group = models.CharField(max_length=4, blank=True, null=True)
    cost_code = models.CharField(max_length=2, blank=True, null=True)
    company = models.ForeignKey('Company', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        db_table = 'cost_center'
        
        
class Subcost(models.Model):
    """Subcentros de costo contable"""
    name = models.CharField(max_length=30, blank=True, null=True)
    cost = models.ForeignKey(CostCenter, on_delete=models.PROTECT, blank=True, null=True)
    subcost_code = models.CharField(max_length=2, blank=True, null=True)
    company = models.ForeignKey('Company', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        db_table = 'subcosts'
        
class Office(models.Model):
    """Sedes o sucursales de la empresa"""
    name = models.CharField(max_length=40, blank=True, null=True)
    compensation_box = models.CharField(max_length=60, blank=True, null=True)
    compensation_code = models.CharField(max_length=8, blank=True, null=True)
    company = models.ForeignKey('Company', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        db_table = 'offices'    
        
        
class ContractTemplate(models.Model):
    """Plantillas de contrato laboral"""
    name = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=255, blank=True, null=True)
    content = models.CharField(max_length=10485760, blank=True, null=True)
    status = models.SmallIntegerField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'contract_templates' 
####* ####################################### * 


class Role(models.Model):
    """Roles personalizados del sistema"""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'roles'


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Usuarios personalizados del sistema"""
    USER_TYPE_CHOICES = [
        ('admin', 'Administrator'),
        ('employee', 'Employee'),
        ('company', 'Company'),
        ('accountant', 'Accountant'),
    ]

    username = None
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='admin')
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True)
    companies = models.ManyToManyField('Company', blank=True)
    # employee = models.ForeignKey('Contratosemp', on_delete=models.PROTECT, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = None
    is_superuser = None
    groups = None
    user_permissions = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def is_admin(self):
        return self.user_type == 'admin'

    def is_employee(self):
        return self.user_type == 'employee'

    def is_company(self):
        return self.user_type == 'company'

    def is_accountant(self):
        return self.user_type == 'accountant'

    class Meta:
        db_table = 'users'


class Token(models.Model):
    """Tokens temporales de sesión"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    temporary_token = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tokens'



class Company(models.Model):
    """Datos principales de la empresa"""
    tax_id = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    verification_digit = models.CharField(max_length=10)
    doc_type = models.CharField(max_length=2)
    legal_representative = models.CharField(max_length=255)

    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=30)
    city = models.ForeignKey(City, on_delete=models.PROTECT)
    country = models.ForeignKey(Country, on_delete=models.PROTECT)

    arl_entity = models.ForeignKey(SocialSecurityEntity, on_delete=models.PROTECT, related_name='arl_contracts')

    payroll_contact = models.CharField(max_length=50)
    payroll_email = models.CharField(max_length=50)
    hr_contact = models.CharField(max_length=50)
    hr_email = models.CharField(max_length=50)

    accounting_contact = models.CharField(max_length=50)
    accounting_email = models.CharField(max_length=50)
    cert_position = models.CharField(max_length=50)
    cert_signature = models.CharField(max_length=50)

    website = models.CharField(max_length=255, blank=True, null=True)
    logo = models.CharField(max_length=40, blank=True, null=True)
    extra_method = models.CharField(max_length=255, blank=True, null=True)
    parafiscals = models.CharField(max_length=2, blank=True, null=True)
    ccf_value = models.CharField(max_length=2, blank=True, null=True)
    sena_icbf_value = models.CharField(max_length=2, blank=True, null=True)
    pension_limit = models.CharField(max_length=2, blank=True, null=True)
    pension_rate = models.CharField(max_length=2, blank=True, null=True)

    bank = models.ForeignKey(Bank, on_delete=models.PROTECT, blank=True, null=True)
    account_number = models.CharField(max_length=255, blank=True, null=True)
    account_type = models.CharField(max_length=10, blank=True, null=True)

    branch_code = models.CharField(max_length=10, blank=True, null=True)
    branch_name = models.CharField(max_length=40, blank=True, null=True)
    contributor_class = models.CharField(max_length=1, blank=True, null=True)
    contributor_type = models.SmallIntegerField(blank=True, null=True)
    adjust_news = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'companies'
        
        

class EmployeeContract(models.Model):
    id = models.AutoField(primary_key=True)
    identification_number = models.BigIntegerField()
    document_type = models.ForeignKey(DocumentType, on_delete=models.DO_NOTHING)

    # Names
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50)
    second_last_name = models.CharField(max_length=50, blank=True, null=True)

    # Contact info
    email = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=12, blank=True, null=True)
    mobile = models.CharField(max_length=12, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)

    # Personal info
    gender = models.CharField(max_length=255, blank=True, null=True)
    birth_date = models.DateField()
    birth_city = models.ForeignKey(City, on_delete=models.DO_NOTHING, related_name='birth_city')
    birth_country = models.ForeignKey(Country, on_delete=models.DO_NOTHING, related_name='birth_country')
    residence_city = models.ForeignKey(City, on_delete=models.DO_NOTHING, related_name='residence_city')
    residence_country = models.ForeignKey(Country, on_delete=models.DO_NOTHING, related_name='residence_country')
    marital_status = models.CharField(max_length=20, blank=True, null=True)

    # Academic and professional info
    profession = models.CharField(max_length=180, blank=True, null=True)
    education_level = models.CharField(max_length=25, blank=True, null=True)

    # Physical info
    height = models.CharField(max_length=10, blank=True, null=True)
    weight = models.CharField(max_length=10, blank=True, null=True)
    blood_type = models.CharField(max_length=10, blank=True, null=True)

    # Document info
    issue_date = models.DateField(blank=True, null=True)
    issue_city = models.ForeignKey(City, on_delete=models.DO_NOTHING, related_name='issue_city')
    resume_format = models.CharField(max_length=25, blank=True, null=True)

    # Uniform sizes
    pants_size = models.CharField(max_length=10, blank=True, null=True)
    shirt_size = models.CharField(max_length=10, blank=True, null=True)
    shoe_size = models.CharField(max_length=10, blank=True, null=True)

    # Other
    contract_status = models.SmallIntegerField(blank=True, null=True)
    socioeconomic_stratum = models.CharField(max_length=5, blank=True, null=True)
    military_book_number = models.CharField(max_length=10, blank=True, null=True)
    photo = models.CharField(max_length=25, blank=True, null=True)

    # Company
    company = models.ForeignKey(Company, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = 'employee_contracts'
        

class Contract(models.Model):
    id = models.AutoField(primary_key=True)
    position = models.ForeignKey(Position, on_delete=models.DO_NOTHING)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    contract_type = models.ForeignKey(ContractType, on_delete=models.DO_NOTHING)
    payroll_type = models.ForeignKey(PayrollType, on_delete=models.DO_NOTHING)
    bank = models.ForeignKey(Bank, on_delete=models.DO_NOTHING, blank=True, null=True)
    account_number = models.CharField(max_length=30, blank=True, null=True)
    account_type = models.CharField(max_length=15, blank=True, null=True)
    work_center = models.ForeignKey(WorkCenter, on_delete=models.DO_NOTHING)
    hiring_city = models.ForeignKey(City, on_delete=models.DO_NOTHING)
    status = models.SmallIntegerField(blank=True, null=True)
    salary = models.IntegerField(blank=True, null=True)
    employee = models.ForeignKey(EmployeeContract, models.DO_NOTHING, blank=True, null=True)
    contributor_type = models.ForeignKey(ContributorType, on_delete=models.DO_NOTHING)
    sub_contributor_type = models.ForeignKey(SubtypeContributor, on_delete=models.DO_NOTHING)
    payment_method = models.CharField(max_length=25, blank=True, null=True)
    withholding_method = models.CharField(max_length=25, blank=True, null=True)
    withholding_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    housing_deduction = models.IntegerField(blank=True, null=True)
    health_withholding = models.IntegerField(blank=True, null=True)
    retired_status = models.CharField(max_length=25, blank=True, null=True)
    liquidation_status = models.CharField(max_length=25, blank=True, null=True)
    social_security_status = models.CharField(max_length=25, blank=True, null=True)
    retirement_reason = models.CharField(max_length=25, blank=True, null=True)
    salary_type = models.ForeignKey(SalaryType, models.DO_NOTHING, blank=True, null=True)
    cost_center = models.ForeignKey(CostCenter, models.DO_NOTHING, blank=True, null=True)
    sub_cost_center = models.ForeignKey(Subcost, models.DO_NOTHING, blank=True, null=True)
    office = models.ForeignKey(Office, models.DO_NOTHING, blank=True, null=True)
    variable_salary = models.SmallIntegerField(blank=True, null=True, default=2)
    eps_entity = models.ForeignKey(SocialSecurityEntity, on_delete=models.DO_NOTHING, related_name='contracts_eps')
    pension_entity = models.ForeignKey(SocialSecurityEntity, on_delete=models.DO_NOTHING, related_name='contracts_afp')
    compensation_fund = models.ForeignKey(SocialSecurityEntity, on_delete=models.DO_NOTHING, related_name='contracts_ccf')
    severance_fund = models.ForeignKey(SocialSecurityEntity, on_delete=models.DO_NOTHING, related_name='contracts_severance', blank=True, null=True)
    transport_assistance = models.BooleanField(default=False)
    dependents = models.SmallIntegerField(blank=True, null=True)
    medical_deduction = models.IntegerField(blank=True, null=True)
    work_shift = models.CharField(max_length=25, blank=True, null=True)
    contract_template = models.ForeignKey(ContractTemplate, models.DO_NOTHING)
    pension_risk = models.BooleanField(default=False)
    company = models.ForeignKey(Company, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = 'contracts'


class Absence(models.Model):
    id = models.AutoField(primary_key=True)
    absence_type = models.ForeignKey(AbsenceType, on_delete=models.DO_NOTHING)
    is_paid = models.BooleanField(default=False)
    hours_to_deduct = models.IntegerField(blank=True, null=True)
    contract = models.ForeignKey(Contract, models.DO_NOTHING)
    novelty_date = models.DateField(blank=True, null=True)
    authorized_by = models.CharField(max_length=50, blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    total_hours = models.IntegerField(blank=True, null=True)
    absence_status = models.SmallIntegerField(blank=True, null=True)
    payroll_id = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'absences'
        
        

