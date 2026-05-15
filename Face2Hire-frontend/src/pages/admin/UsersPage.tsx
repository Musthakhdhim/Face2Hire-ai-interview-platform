import { useState, useEffect, useCallback, type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, UserX, UserCheck, Eye, Mail, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { userService, type PaginatedResponse } from '../../services/userService';
import type { UserListResponseDto } from '../../types/user';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
}

export default function AdminUsersPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0); 
  const pageSize = 10;

  const [users, setUsers] = useState<UserListResponseDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const isActive =
        statusFilter === 'active' ? true :
        statusFilter === 'blocked' ? false :
        null;
      const filter = {
        search: searchQuery || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter.toUpperCase(),
        isActive,
        page: currentPage,
        size: pageSize,
      };
      const response: PaginatedResponse<UserListResponseDto> = await userService.getUsers(filter);
      setUsers(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchUsers();
}, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0); 
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handleBlockUser = async (userId: number) => {
    setActionLoading(userId);
    try {
      await userService.blockUser(userId);
      toast.success('User blocked successfully');
      fetchUsers(); // refresh list
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    setActionLoading(userId);
    try {
      await userService.unblockUser(userId);
      toast.success('User unblocked successfully');
      fetchUsers();
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    } finally {
      setActionLoading(null);
    }
  };

  const goToPage = (page: number) => setCurrentPage(page);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Search, filter, and manage all users</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="interviewee">Interviewee</SelectItem>
                <SelectItem value="interviewer">Interviewer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Users ({totalElements})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-indigo-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Search className="size-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="size-16">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {(user.fullName?.[0] || user.userName?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {user.fullName || user.userName}
                            </h3>
                            <Badge variant="outline" className="capitalize">
                              {user.role.toLowerCase()}
                            </Badge>
                            <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {user.isActive ? 'Active' : 'Blocked'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="size-4" />
                              {user.email}
                            </div>
                            {user.lastLoginAt && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="size-4" />
                                Joined: {formatDate(user.createdAt)} | Last Active: {formatDate(user.lastLoginAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {user.role === 'INTERVIEWEE' && (
                        <div className="grid grid-cols-2 gap-4 lg:w-64">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                            <div className="text-2xl font-bold text-blue-600">0</div>
                            <div className="text-xs text-gray-600">Interviews</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                            <div className="text-2xl font-bold text-green-600">0%</div>
                            <div className="text-xs text-gray-600">Avg Score</div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 size-4" />
                          View Details
                        </Button>
                        {actionLoading === user.id ? (
                          <Button size="sm" disabled>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Processing...
                          </Button>
                        ) : user.isActive ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlockUser(user.id)}
                          >
                            <UserX className="mr-2 size-4" />
                            Block User
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            <UserCheck className="mr-2 size-4" />
                            Unblock User
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!canPrevious}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}