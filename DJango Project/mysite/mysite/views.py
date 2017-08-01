
from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
def main(request):
    return HttpResponse("Hello, world. You're at on the main Page.")
