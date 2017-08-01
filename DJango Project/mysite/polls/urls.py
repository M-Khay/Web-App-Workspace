from django.conf.urls import url

from . import views

urlpatterns = [
 # you can replace ^$ with ^.* to match with any character being enetered in the url to this one place.
    url(r'^$', views.index, name='index'),
    # url(r'^(? P<question_id>[0-9]+/$', views.detail, name= 'detail'),	
    url(r'^(?P<question_id>[0-9]+)/$', views.detail, name='detail'),
    url(r'^(?P<question_id>[0-9]+)/results/$', views.results, name='results'),
    url(r'^(?P<question_id>[0-9]+)/vote/$',views.vote, name ='vote'),
]