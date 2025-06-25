from django.shortcuts import redirect
from django.urls import NoReverseMatch

"""
Funciones para redirección basada en roles de usuario

Estas funciones se encargan de redirigir al usuario a diferentes vistas basadas en su rol en el sistema.

1. `redirect_by_role(user)`
    Redirige al usuario a una vista específica según su rol en el sistema. Si el rol no es reconocido, redirige a una página de error.

    Parámetros
    ----------
    user : str
        El rol del usuario (por ejemplo, 'admin', 'accountant', 'employee', 'company').

    Retorna
    -------
    HttpResponseRedirect
        Una redirección HTTP a la vista correspondiente al rol del usuario, o a una página de error si el rol no es reconocido.

    Descripción
    -----------
    La función toma el rol del usuario y utiliza un diccionario para mapearlo a la vista correspondiente. Si la vista no es válida, se redirige al usuario a una página de error.
    
    Ejemplo
    -------
    redirect_by_role('admin') -> redirige a 'admin:admin'
    redirect_by_role('employee') -> redirige a 'employees:index_employees'
    
    Excepciones
    -----------
    NoReverseMatch: Si la vista no puede ser encontrada, el usuario será redirigido a la página de error.
    
---

2. `redirect_by_role2(user)`
    Retorna el nombre de la vista a la que el usuario debe ser redirigido según su rol. Si el rol no existe en el diccionario, retorna una página de error.

    Parámetros
    ----------
    user : str
        El rol del usuario (por ejemplo, 'administrator', 'accountant', 'employees', 'entrepreneur').

    Retorna
    -------
    str
        El nombre de la vista correspondiente al rol del usuario, o 'error_page' si el rol no es reconocido.

    Descripción
    -----------
    Esta función mapea el rol del usuario con la vista correspondiente utilizando un diccionario. Si el rol no es encontrado, se retorna 'error_page'.
    
    Ejemplo
    -------
    redirect_by_role2('administrator') -> 'admin:admin'
    redirect_by_role2('employees') -> 'employees:index_employees'
"""


def redirect_by_role(user):
# Diccionario de roles y vistas asociadas
    role_views = {
        'admin': 'admin:admin',
        'accountant': 'payroll:select_company',
        'employee': 'employees:index_employees',
        'company': 'companies:index_companies',
    }

    # Obtener la vista correspondiente al rol del usuario
    url_name = role_views.get(user, 'login:error_page')
    
    try:
        # Intentar redirigir al usuario a la vista correspondiente
        return redirect(url_name)
    except NoReverseMatch:
        # Si la vista no existe, redirigir a la página de error
        return redirect('login:error_page')
    
    
