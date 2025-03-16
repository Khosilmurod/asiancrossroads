from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'

class IsPresident(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'PRESIDENT'

class IsBoardOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['ADMIN', 'PRESIDENT', 'BOARD'] 