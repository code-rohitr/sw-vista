import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Entity {
  id: string;
  name: string;
  description: string;
  entityType_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  entityType: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
}

interface UserEntityMembership {
  entity: Entity;
  entityRole: {
    id: string;
    name: string;
    description: string;
    entityType_id: string;
    entity_id: string;
    template_id: string;
    created_at: string;
    updated_at: string;
    template: {
      id: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
    };
    entityRolePermissions: Array<{
      id: string;
      entity_role_id: string;
      permission_id: string;
      resource_id: string;
      created_at: string;
      permission: {
        id: string;
        name: string;
        description: string;
        action: string;
        scope: string;
        resource_type: string;
        created_by: string;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      };
      resource: {
        id: string;
        name: string;
        path: string;
        description: string;
        created_at: string;
        updated_at: string;
      };
    }>;
  };
}

export function EntityDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userMemberships, setUserMemberships] = useState<UserEntityMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    const fetchUserMemberships = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserMemberships(data.entityMemberships || []);
          
          // If we're on an entity page, set the selected entity
          const entityId = pathname.split('/')[2];
          if (entityId && entityId !== 'new') {
            const membership = data.entityMemberships?.find(
              (m: UserEntityMembership) => m.entity.id === entityId
            );
            if (membership) {
              setSelectedEntity(membership.entity);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user memberships:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserMemberships();
    }
  }, [user, pathname]);

  const filteredEntities = userMemberships
    .filter(membership =>
      membership.entity.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(membership => membership.entity);

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    router.push(`/dashboard/entities/${entity.id}`);
  };

  if (!userMemberships.length) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          {selectedEntity ? selectedEntity.name : 'Select Entity'}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {filteredEntities.map((entity) => (
          <DropdownMenuItem
            key={entity.id}
            onClick={() => handleEntitySelect(entity)}
            className={`flex items-center justify-between ${
              selectedEntity?.id === entity.id ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <span>{entity.name}</span>
            <span className="text-xs text-muted-foreground">
              {entity.entityType?.name || 'Unknown Type'}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 