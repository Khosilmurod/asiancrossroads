from rest_framework import permissions

class IsAdminOrBoardMember(permissions.BasePermission):
    """
    Custom permission to only allow admins, presidents, and board members to access.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'PRESIDENT', 'BOARD']

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any admin, president, or board member
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['ADMIN', 'PRESIDENT', 'BOARD']

        # Write permissions are only allowed to admins and presidents
        return request.user.role in ['ADMIN', 'PRESIDENT'] 