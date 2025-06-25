from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit, HTML, Field ,Row , Column 


class LoginForm(forms.Form):
    
    """
    Formulario para el inicio de sesión del usuario.

    Este formulario solicita el correo electrónico y la contraseña del usuario para autenticarlo en el sistema.

    Attributes
    ----------
    email : forms.CharField
        Campo para ingresar el correo electrónico del usuario.
    password : forms.CharField
        Campo para ingresar la contraseña del usuario.

    Methods
    -------
    __init__(*args, **kwargs)
        Configura el formulario, incluyendo el diseño y el método de envío.
    """
    
    
    email = forms.CharField(label='Correo electronico:', widget=forms.TextInput(attrs={'placeholder': 'Ingrese su Correo electronico'}))
    password = forms.CharField(label='Contraseña:', max_length=30, widget=forms.PasswordInput(attrs={'placeholder': 'Ingrese su contraseña'}))

    def __init__(self, *args, **kwargs):
        
        """
        Inicializa el formulario configurando los atributos del formulario y el diseño con crispy-forms.

        Parameters
        ----------
        *args : tuple
            Argumentos posicionales.
        **kwargs : dict
            Argumentos de palabra clave.
        """
        
        
        super(LoginForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Row(
                Column('email', css_class='form-group mb-3'),
                css_class='form-row'
            ),
            Row(
                Column('password', css_class='form-group mb-3'),
                css_class='form-row'
            ),
            Submit('submit', 'Ingresar', css_class='btn btn-light-success w-100')
        )
        
        
        
        
class PasswordResetForm(forms.Form):
    """
    Formulario para solicitar el restablecimiento de la contraseña mediante correo electrónico.

    Este formulario solicita el correo electrónico del usuario para enviar un enlace de restablecimiento de contraseña.

    Attributes
    ----------
    email : forms.EmailField
        Campo para ingresar el correo electrónico del usuario.

    Methods
    -------
    __init__(*args, **kwargs)
        Configura el formulario, incluyendo el diseño y el método de envío.
    """
    
    email = forms.EmailField()
    
    def __init__(self, *args, **kwargs):
        """
        Inicializa el formulario configurando los atributos del formulario y el diseño con crispy-forms.

        Parameters
        ----------
        *args : tuple
            Argumentos posicionales.
        **kwargs : dict
            Argumentos de palabra clave.
        """
        
        
        super(PasswordResetForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Row(
                Column('email', css_class='form-group mb-2'),
                css_class='form-row'
            ),
            Submit('submit', 'Enviar', css_class='btn btn-light-success w-100')
        )
    
    
class PasswordResetTokenForm(forms.Form):
    """
    Formulario para establecer una nueva contraseña usando un token temporal.

    Este formulario solicita dos campos de contraseña para que el usuario ingrese y confirme su nueva contraseña.
    Verifica que ambas contraseñas coincidan antes de proceder con el cambio.

    Attributes
    ----------
    password1 : forms.CharField
        Campo para ingresar la nueva contraseña.
    password2 : forms.CharField
        Campo para confirmar la nueva contraseña.

    Methods
    -------
    clean()
        Método que valida que las contraseñas coincidan.
    __init__(*args, **kwargs)
        Configura el formulario, incluyendo el diseño y el método de envío.
    """
    
    
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput, help_text='Su contraseña no puede ser demasiado similar a su otra información personal.')
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput, help_text='Ingrese la misma contraseña que antes, para verificación.')
    
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        # Verificar si las contraseñas coinciden
        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Las contraseñas no coinciden.')

        return cleaned_data
    
    def __init__(self, *args, **kwargs):
        """
        Inicializa el formulario configurando los atributos del formulario y el diseño con crispy-forms.

        Parameters
        ----------
        *args : tuple
            Argumentos posicionales.
        **kwargs : dict
            Argumentos de palabra clave.
        """
        super(PasswordResetTokenForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Row(
                Column('password1', css_class='form-group mb-2'),
                css_class='form-row'
            ),
            Row(
                Column('password2', css_class='form-group mb-2'),
                css_class='form-row'
            ),
            Submit('submit', 'Guardar', css_class='btn btn-light-success w-100')
        )
    """ 
    Notes
        -----
        El formulario tiene un clean que le permite validar si las contraseñas son el mismo valor 
        para recomendacion se deberia agreagr un validador de formato de contraseña para volverlo mas seguro 
    
    """
