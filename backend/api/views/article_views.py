from rest_framework import viewsets, permissions
from api.models import Article
from api.serializers import ArticleSerializer
from accounts.permissions import IsBoardOrHigher

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(is_published=True)
    serializer_class = ArticleSerializer
    permission_classes = [IsBoardOrHigher]

    def get_queryset(self):
        # Non-board members can only see published articles
        if not self.request.user.is_authenticated or \
           self.request.user.role not in ['ADMIN', 'PRESIDENT', 'BOARD']:
            return Article.objects.filter(is_published=True)
        return Article.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
