from django.contrib import admin
from django.urls import path
from login.views.access import access 

urlpatterns = [
    path('', access.Login_view , name='login'),
    
]
