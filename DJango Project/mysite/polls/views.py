from django.shortcuts import render
from django.shortcuts import get_object_or_404, render
from django.http import Http404
from django.http import HttpResponse
from .models import Question
from django.template import loader
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse
from rest_framework import generics, permissions, response, throttling, views

from .models import Choice, Question
from serializers import *
def index(request):
    latest_question_list = Question.objects.all()
    template = loader.get_template('polls/index.html')
    context = {
    'latest_question_list' : latest_question_list,
    }
    # output = "\n".join([q.question_text for q in latest_question_list])
    # return HttpResponse(output)
    return HttpResponse(template.render(context,request))

def detail(request, question_id):
    question = get_object_or_404(Question, pk=question_id)
    serializer = QuestionSerializer(question)
    return render(request, 'polls/results.html', {'question':question})
    # return response.Response(serializer.data, status=200)

def results(request, question_id):
    # response = "You're looking at the results of quetsions %s."
    # return HttpResponse(response % question_id)
    question = get_object_or_404(Question, pk=question_id)
    return render(request, 'polls/results.html', {'question': question})
def vote(request,  question_id):
    # return HttpResponse("You are voting on a question %s" % question_id)
    question = get_object_or_404(Question, pk=question_id)
    try:
        selected_choice = question.choice_set.get(pk=request.POST['choices'])
    except (KeyError, Choice.DoesNotExist):
        # Redisplay the question voting form.
        return render(request, 'polls/detail.html', {
            'question': question,
            'error_message': "You didn't select a choice.",
        })
    else:
        selected_choice.votes += 1
        selected_choice.save()
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return HttpResponseRedirect(reverse('polls:results', args=(question.id,)))