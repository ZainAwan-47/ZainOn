/**
 * Group Module Constants & Role-Based Access Control Matrix
 */

// Scalar named exports for UI Component compatibility
export const MIN_GROUP_SELECTED_FRIENDS = 2; // Owner + 2 friends = 3 members minimum
export const MAX_GROUP_MEMBERS = 256;

// Structured limits object for backend service compatibility
export const GROUP_LIMITS = {
    MIN_SELECTED_FRIENDS: MIN_GROUP_SELECTED_FRIENDS,
    MAX_MEMBERS: MAX_GROUP_MEMBERS,
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 250,
};

export const GROUP_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
};

export const GROUP_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    READ_ONLY: 'read_only',
};

export const GROUP_PERMISSIONS = {
    RENAME_GROUP: 'rename_group',
    UPDATE_AVATAR: 'update_avatar',
    UPDATE_DESCRIPTION: 'update_description',
    INVITE_MEMBERS: 'invite_members',
    REMOVE_MEMBERS: 'remove_members',
    PROMOTE_ADMIN: 'promote_admin',
    DEMOTE_ADMIN: 'demote_admin',
    TRANSFER_OWNERSHIP: 'transfer_ownership',
    DELETE_GROUP: 'delete_group',
    SEND_MESSAGES: 'send_messages',
};

/**
 * Granular Role Permission Mapping
 */
export const ROLE_PERMISSIONS_MAP = {
    [GROUP_ROLES.OWNER]: [
        GROUP_PERMISSIONS.RENAME_GROUP,
        GROUP_PERMISSIONS.UPDATE_AVATAR,
        GROUP_PERMISSIONS.UPDATE_DESCRIPTION,
        GROUP_PERMISSIONS.INVITE_MEMBERS,
        GROUP_PERMISSIONS.REMOVE_MEMBERS,
        GROUP_PERMISSIONS.PROMOTE_ADMIN,
        GROUP_PERMISSIONS.DEMOTE_ADMIN,
        GROUP_PERMISSIONS.TRANSFER_OWNERSHIP,
        GROUP_PERMISSIONS.DELETE_GROUP,
        GROUP_PERMISSIONS.SEND_MESSAGES,
    ],
    [GROUP_ROLES.ADMIN]: [
        GROUP_PERMISSIONS.RENAME_GROUP,
        GROUP_PERMISSIONS.UPDATE_AVATAR,
        GROUP_PERMISSIONS.UPDATE_DESCRIPTION,
        GROUP_PERMISSIONS.INVITE_MEMBERS,
        GROUP_PERMISSIONS.REMOVE_MEMBERS,
        GROUP_PERMISSIONS.SEND_MESSAGES,
    ],
    [GROUP_ROLES.MEMBER]: [
        GROUP_PERMISSIONS.SEND_MESSAGES,
    ],
};

export const DEFAULT_GROUP_AVATARS = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=80',
];