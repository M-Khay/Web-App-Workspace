from rest_framework import serializers
class QuestionSerializer(serializers.Serializer):
	question_text = serializers.CharField(max_length=200)
	pub_date = serializers.DateTimeField()