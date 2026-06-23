
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Conversation, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, User as UserIcon, MoreHorizontal, Archive, Trash2, UserPlus, MessageSquare, UserX, BellOff, Users, Plus } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import UserProfile from './user-profile';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SwipeableChatItem from './swipeable-chat-item';
import CreateGroupDialog from './create-group-dialog';

type UserListProps = {
  conversations: Conversation[];
  activeConversation: Conversation | undefined;
  onConversationSelect: (conversation: Conversation) => void;
  users: User[];
  currentUser: User;
  onDeleteConversation: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string) => void;
  onRemoveContact: (userId: string) => void;
  onAddContact: (userId: string) => void;
  onBackToMain: () => void;
  onSettingsClick: () => void;
  onHelpClick?: () => void;
  onCreateGroup?: (groupData: { name: string; participants: string[]; avatar?: string; }) => void;
  isMobile?: boolean;
};

function genConvId(userId1: string, userId2: string) {
    const sortedIds = [userId1, userId2].sort();
    return `private-${sortedIds[0]}-${sortedIds[1]}`;
}

export default function UserList({
  conversations,
  onConversationSelect,
  activeConversation,
  users,
  currentUser,
  onDeleteConversation,
  onArchiveConversation,
  onRemoveContact,
  onAddContact,
  onBackToMain,
  onSettingsClick,
  onHelpClick,
  onCreateGroup,
  isMobile,
}: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [isLoading, setIsLoading] = useState(true);

  // Update loading state when data changes
  useEffect(() => {
    setIsLoading(users.length === 0 && conversations.length === 0);
  }, [users.length, conversations.length]);
  
  const filteredConversations = useMemo(() => {
    const convs = conversations.filter(c => c.participants.includes(currentUser.id) && !c.archived);
    if (!searchTerm) {
        return convs.sort((a,b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
    }
    return convs.filter((conv) =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
  }, [conversations, searchTerm, currentUser.id]);

  // Get ALL conversations (including groups and private chats) OR available users
  const allChattedUsers = useMemo(() => {
    // Get all conversations where current user is a participant, sorted by most recent
    const userConversations = conversations
      .filter(c => c.participants.includes(currentUser.id))
      .sort((a, b) => new Date(b.timestamp as string || 0).getTime() - new Date(a.timestamp as string || 0).getTime());
    
    // For private conversations, map to the other user
    // For group conversations, create a virtual "user" object representing the group
    const conversationItems = userConversations.map(conv => {
      if (conv.type === 'group') {
        // Create a virtual user object for the group
        return {
          user: {
            id: conv.id, // Use conversation ID as the "user" ID for groups
            name: conv.name,
            username: conv.id,
            email: '',
            avatar: conv.avatar,
            status: 'online' as const,
          },
          conversation: conv,
          hasActiveConversation: !conv.archived,
          isGroup: true,
        };
      } else {
        // Private conversation - find the other user
        const otherUserId = conv.participants.find(id => id !== currentUser.id);
        const otherUser = users.find(u => u.id === otherUserId);
        
        if (otherUser) {
          return {
            user: otherUser,
            conversation: conv,
            hasActiveConversation: !conv.archived,
            isGroup: false,
          };
        }
        return null;
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null);
    
    // If no conversations and no search term, show available users to chat with
    if (conversationItems.length === 0 && !searchTerm && users.length > 0) {
      return users
        .filter(user => user.id !== currentUser.id)
        .slice(0, 20) // Show more available users
        .map(user => ({
          user,
          conversation: null,
          hasActiveConversation: false,
          isGroup: false,
        }));
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return conversationItems.filter(({ user, conversation }) =>
        user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        user.username.toLowerCase().includes(lowerCaseSearchTerm) ||
        conversation?.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    return conversationItems.sort((a, b) => {
      // Sort by most recent conversation timestamp
      const aTime = new Date(a.conversation?.timestamp as string || 0).getTime();
      const bTime = new Date(b.conversation?.timestamp as string || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, filteredConversations, users, currentUser.id, searchTerm]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
        (user.username.toLowerCase().includes(lowerCaseSearchTerm) || user.name.toLowerCase().includes(lowerCaseSearchTerm) || user.email.toLowerCase().includes(lowerCaseSearchTerm)) 
        && user.id !== currentUser.id
    );
  }, [searchTerm, currentUser.id, users]);

  const contacts = useMemo(() => {
    return users.filter(user => currentUser.contacts?.includes(user.id));
  }, [users, currentUser.contacts]);

    const groups = useMemo(() => {
      return conversations.filter(conv => 
        conv.type === 'group' && conv.participants.includes(currentUser.id)
      );
    }, [conversations, currentUser.id]);

  const handleUserSelect = (user: User) => {
    const convId = genConvId(currentUser.id, user.id);
    const existingConversation = conversations.find(c => c.id === convId);

    if (existingConversation) {
        onConversationSelect(existingConversation);
    } else {
        const newConversation: Conversation = {
            id: convId,
            type: 'private',
            name: user.name,
            avatar: user.avatar,
            participants: [currentUser.id, user.id],
            lastMessage: `Started a conversation with ${user.name}`,
        };
        onConversationSelect(newConversation);
    }
    setSearchTerm('');
    setActiveTab('chats');
  };

  const handleAddContact = (userId: string) => {
    // Delegate to parent (chat-layout) to persist the contact
    onAddContact(userId);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      setActiveTab('search');
    } else if (activeTab === 'search') {
      setActiveTab('chats');
    }
  };

  const handleTabChange = (value: string) => {
    setSearchTerm('');
    setActiveTab(value);
  }

  const renderContent = () => {
    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-none bg-transparent p-0">
          <TabsTrigger value="chats" className="h-full rounded-none data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground">
            Chats
          </TabsTrigger>
          <TabsTrigger value="groups" className="h-full rounded-none data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground">
            Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="m-0">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center text-muted-foreground p-8">
              <div className="animate-pulse">
                <div className="h-4 w-4 mx-auto mb-2 bg-muted-foreground rounded"></div>
                <p className="text-sm">Loading chats...</p>
              </div>
            </div>
          )}
          
          {/* All Chatted Users */}
          {!isLoading && allChattedUsers.map(({ user, conversation, hasActiveConversation }) => (
            <SwipeableChatItem
              key={user.id}
              user={user}
              conversation={conversation}
              hasActiveConversation={hasActiveConversation}
              isActive={activeConversation?.id === conversation?.id}
              onSelect={() => handleUserSelect(user)}
              onArchive={conversation ? onArchiveConversation : undefined}
              onDelete={conversation ? onDeleteConversation : undefined}
              isMobile={isMobile}
            />
          ))}
          
          {/* Empty state - only show when no chats at all */}
          {!isLoading && allChattedUsers.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-semibold">No users found.</p>
            <p className="text-sm">Try searching for users or check the Groups tab to find group conversations.</p>
              </div>
          )}
        </TabsContent>
          <TabsContent value="groups" className="m-0">
              {/* Create Group Button */}
              {onCreateGroup && groups.length > 0 && (
                <div className="p-3 border-b border-sidebar-border">
                  <Button
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full justify-start bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Create New Group
                  </Button>
                </div>
              )}

            {groups.map((group) => {
             // Check if there's an active conversation with this contact
               const isActiveGroup = activeConversation?.id === group.id;
             
             return (
              <div key={group.id} className="flex items-center justify-between p-3 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
                  <button
                    onClick={() => onConversationSelect(group)}
                    className="flex items-center gap-3 flex-1 text-left overflow-hidden"
                  >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={group.avatar} alt={group.name} />
                            <AvatarFallback>
                              <Users className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        {!group.muted && group.unreadCount && group.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-semibold">{group.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                          <p className="font-semibold truncate text-sidebar-foreground">{group.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {group.lastMessage || 'No messages yet'} • {group.participants.length} members
                          </p>
                      </div>
                  </button>
                  <div className='flex items-center'>
                    <Button variant="ghost" size="icon" onClick={() => onConversationSelect(group)} className="text-primary hover:text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onArchiveConversation && onArchiveConversation(group.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteConversation && onDeleteConversation(group.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Leave group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
              </div>
             );
           })}
    {groups.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
                  <Users className="h-10 w-10 mx-auto mb-2" />
      <p className="font-semibold">No groups yet.</p>
      <p className="text-sm">Create a group to start collaborating with multiple people.</p>
                {onCreateGroup && (
                  <Button
                    onClick={() => setShowCreateGroup(true)}
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Create Your First Group
                  </Button>
                )}
              </div>
          )}
        </TabsContent>
        <TabsContent value="search" className="m-0">
          {searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border-b border-sidebar-border">
              <div className='flex items-center gap-3'>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold truncate text-sidebar-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!currentUser.contacts?.includes(user.id) ? (
                  <Button variant="outline" size="sm" onClick={() => handleAddContact(user.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => handleUserSelect(user)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <p>No users found for "{searchTerm}".</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-transparent", isMobile ? "pb-2" : "")}>
      <div className={cn("border-b border-sidebar-border", isMobile ? "p-2" : "p-4")}> 
        <div className={cn("flex items-center justify-between", isMobile ? "gap-2" : "")}> 
          <h1 className={cn("tracking-tight text-sidebar-foreground", isMobile ? "text-lg font-bold" : "text-xl font-bold")}> 
            ChatterBox
          </h1>
          {onCreateGroup && (
            <Button
              size={isMobile ? "sm" : "icon"}
              variant="ghost"
              onClick={() => setShowCreateGroup(true)}
              className={cn("text-sidebar-foreground hover:bg-sidebar-accent", isMobile ? "h-7 w-7" : "h-8 w-8")}
              title="Create Group"
            >
              <Users className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          )}
        </div>
        <div className={cn("relative", isMobile ? "mt-2" : "mt-4")}> 
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", isMobile ? "h-3 w-3" : "h-4 w-4")} />
          <Input
            placeholder="Search users..."
            className={cn("bg-sidebar-accent border-none focus-visible:ring-sidebar-ring", isMobile ? "pl-8 py-1 text-sm" : "pl-9")}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <ScrollArea className={cn("flex-1", isMobile ? "min-h-[300px]" : "")}>
        {renderContent()}
      </ScrollArea>

      <div className={cn("border-t border-sidebar-border", isMobile ? "p-1" : "p-2")}> 
        <UserProfile currentUser={currentUser} onSettingsClick={onSettingsClick} onHelpClick={onHelpClick} />
      </div>

      {onCreateGroup && (
        <CreateGroupDialog
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={(groupData) => {
            onCreateGroup(groupData);
            setShowCreateGroup(false);
          }}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
