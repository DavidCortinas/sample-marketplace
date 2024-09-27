from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import UserProfile, Query, CustomUser, MusicServiceConnection

User = get_user_model()


class profileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = (
        "username",
        "birthdate",
        "user_type",
        "profession",
        "profile_image",
        "profile_image_preview",
    )
    readonly_fields = ("profile_image_preview",)

    def profile_image_preview(self, instance):
        if instance.profile_image:
            return format_html(
                '<img src="{}" width="150" height="150" />', instance.profile_image.url
            )
        return "No image uploaded"


class MusicServiceConnectionInline(admin.TabularInline):
    model = MusicServiceConnection
    extra = 0
    readonly_fields = ('service_name', 'is_connected', 'last_connected', 'service_user_id', 'token_expires_at')
    fields = ('service_name', 'is_connected', 'last_connected', 'service_user_id', 'token_expires_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CustomUserAdmin(UserAdmin):
    inlines = (profileInline, MusicServiceConnectionInline,)
    list_display = (
        "email",
        "is_active",
        "email_verified",
        "onboarding_completed",
        "date_joined",
        "get_username",
        "get_user_type",
        "get_connected_services",
    )
    list_filter = (
        "is_active",
        "email_verified",
        "onboarding_completed",
    )
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        ("Custom fields", {"fields": ("email_verified", "onboarding_completed")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )
    search_fields = ("email", "profile__username")
    ordering = ("email",)

    def get_username(self, obj):
        return obj.profile.username

    get_username.short_description = "Username"
    get_username.admin_order_field = "profile__username"

    def get_user_type(self, obj):
        return obj.profile.user_type

    get_user_type.short_description = "User Type"
    get_user_type.admin_order_field = "profile__user_type"

    def get_connected_services(self, obj):
        return ", ".join([conn.service_name for conn in obj.music_service_connections.filter(is_connected=True)])
    get_connected_services.short_description = 'Connected Services'


admin.site.register(User, CustomUserAdmin)

admin.site.register(Query)

@admin.register(MusicServiceConnection)
class MusicServiceConnectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'service_name', 'is_connected', 'last_connected', 'token_expires_at')
    list_filter = ('service_name', 'is_connected')
    search_fields = ('user__email', 'service_name')
    readonly_fields = ('user', 'service_name', 'is_connected', 'last_connected', 'service_user_id', 'token_expires_at')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
