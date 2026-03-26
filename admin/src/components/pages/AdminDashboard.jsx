import { useState, useEffect } from 'react';
import DashboardNav from './DashboardNav';
import Analytics from './Analytics';
import CustomDatasetAnalytics from './CustomDatasetAnalytics';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Package, 
  CheckCircle, 
  DollarSign, 
  Upload, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  User,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";


const AdminDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [sampleRequests, setSampleRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    price: '',
    quantity: ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const [activeView, setActiveView] = useState('materials'); // 'materials', 'analytics', 'customDataset', 'sampleRequests'

  useEffect(() => {
    fetchMaterials();
    if (activeView === 'sampleRequests') {
      fetchSampleRequests();
    }
  }, [activeView]);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.materials) {
        console.log('Fetched materials:', data.materials);
        setMaterials(data.materials);
      }
    } catch (err) {
      console.error('Fetch materials error:', err);
      setError('Failed to load materials');
    }
  };

  const fetchSampleRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/chat/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const chats = await response.json();
      
      // Filter chats that contain sample requests (messages with 📦 New Sample Request)
      const requests = [];
      chats.forEach(chat => {
        chat.messages.forEach((msg, idx) => {
          if (msg.sender === 'user' && msg.text.includes('📦 New Sample Request')) {
            requests.push({
              ...msg,
              chatId: chat._id,
              userId: chat.userId,
              userName: chat.userName,
              messageIndex: idx
            });
          }
        });
      });
      
      // Sort by timestamp, newest first
      requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSampleRequests(requests);
    } catch (err) {
      console.error('Fetch sample requests error:', err);
      setError('Failed to load sample requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setUploadingImage(true);
    setError('');
    console.log('Starting image upload...', selectedFile.name);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setUploadingImage(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedFile);

      console.log('Uploading to: http://localhost:5000/api/upload/image');
      const response = await fetch(`${API}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok) {
        setFormData({
          ...formData,
          imageUrl: data.imageUrl
        });
        console.log('Image URL set to:', data.imageUrl);
        setSuccess('Image uploaded successfully!');
        setSelectedFile(null);
        // Clear the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        console.error('Upload failed:', data);
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const url = editingId 
        ? `${API}/api/materials/${editingId}`
        : `${API}/api/materials`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          quantity: parseInt(formData.quantity) || 0,
          isActive: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Material saved successfully!');
        console.log('Material saved:', data.material);
        setFormData({
          title: '',
          description: '',
          category: '',
          imageUrl: '',
          price: '',
          quantity: ''
        });
        setEditingId(null);
        fetchMaterials();
      } else {
        console.error('Save failed:', data);
        setError(data.error || 'Failed to save material');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      title: material.title,
      description: material.description || '',
      category: material.category || '',
      imageUrl: material.imageUrl || '',
      price: material.price || '',
      quantity: material.quantity || ''
    });
    setEditingId(material._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Material deleted successfully!');
        fetchMaterials();
      } else {
        setError(data.error || 'Failed to delete material');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete material');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      imageUrl: '',
      price: '',
      quantity: ''
    });
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
              <Package className="w-10 h-10 text-blue-600 animate-pulse" />
              Admin Dashboard
            </h1>
            <p className="text-slate-600 text-lg">Manage your textile materials inventory</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-800">{materials.length}</div>
                    <div className="text-sm text-slate-600">Total Materials</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-800">{materials.filter(m => m.quantity > 0).length}</div>
                    <div className="text-sm text-slate-600">In Stock</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-800">Rs.{materials.reduce((sum, m) => sum + (m.price * m.quantity), 0).toFixed(0)}</div>
                    <div className="text-sm text-slate-600">Total Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Alert Messages */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* View Toggle */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={() => setActiveView('materials')}
            variant={activeView === 'materials' ? "default" : "outline"}
            className={activeView === 'materials' ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Package className="w-4 h-4 mr-2" />
            Materials Management
          </Button>
          <Button
            onClick={() => setActiveView('sampleRequests')}
            variant={activeView === 'sampleRequests' ? "default" : "outline"}
            className={activeView === 'sampleRequests' ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Sample Requests
            {sampleRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{sampleRequests.length}</Badge>
            )}
          </Button>
          <Button
            onClick={() => setActiveView('analytics')}
            variant={activeView === 'analytics' ? "default" : "outline"}
            className={activeView === 'analytics' ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Database Analytics
          </Button>
          <Button
            onClick={() => setActiveView('customDataset')}
            variant={activeView === 'customDataset' ? "default" : "outline"}
            className={activeView === 'customDataset' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Custom Dataset
          </Button>
        </div>
        
        {/* Conditional Content */}
        {activeView === 'analytics' ? (
          <Analytics materials={materials} />
        ) : activeView === 'customDataset' ? (
          <CustomDatasetAnalytics />
        ) : activeView === 'sampleRequests' ? (
          <div>
            <Card className="shadow-xl border-2">
              <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-orange-100">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Sample Requests
                  <Badge className="ml-2 bg-orange-600">{sampleRequests.length}</Badge>
                </CardTitle>
                <CardDescription>View and manage customer sample requests</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingRequests ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Loading sample requests...</p>
                  </div>
                ) : sampleRequests.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <MessageSquare className="w-20 h-20 mx-auto text-slate-300" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-slate-600">No Sample Requests Yet</h3>
                      <p className="text-slate-500">Customer sample requests will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sampleRequests.map((request, index) => {
                      const lines = request.text.split('\n');
                      const details = {};
                      
                      lines.forEach(line => {
                        if (line.startsWith('Name:')) details.name = line.replace('Name:', '').trim();
                        if (line.startsWith('Company:')) details.company = line.replace('Company:', '').trim();
                        if (line.startsWith('Email:')) details.email = line.replace('Email:', '').trim();
                        if (line.startsWith('Phone:')) details.phone = line.replace('Phone:', '').trim();
                        if (line.startsWith('Address:')) details.address = line.replace('Address:', '').trim();
                        if (line.startsWith('Notes:')) details.notes = line.replace('Notes:', '').trim();
                        if (line.startsWith('Request Date:')) details.requestDate = line.replace('Request Date:', '').trim();
                      });
                      
                      const materialsStartIndex = lines.findIndex(l => l.includes('Materials Requested:'));
                      const materialsEndIndex = lines.findIndex((l, i) => i > materialsStartIndex && (l.startsWith('Notes:') || l.startsWith('Request Date:')));
                      const materialsText = materialsEndIndex > materialsStartIndex 
                        ? lines.slice(materialsStartIndex + 1, materialsEndIndex).join(', ').trim()
                        : lines.slice(materialsStartIndex + 1).join(', ').split('Notes:')[0].split('Request Date:')[0].trim();
                      
                      return (
                        <Card key={index} className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 border-b">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                  <User className="w-5 h-5 text-orange-600" />
                                  {details.name || request.userName}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">User ID: {request.userId}</p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-orange-600 text-white">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(request.timestamp).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <User className="w-4 h-4 text-slate-400 mt-1" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-semibold">Company</p>
                                    <p className="text-sm text-slate-800">{details.company || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <Mail className="w-4 h-4 text-slate-400 mt-1" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-semibold">Email</p>
                                    <p className="text-sm text-slate-800">{details.email || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-semibold">Phone</p>
                                    <p className="text-sm text-slate-800">{details.phone || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-semibold">Delivery Address</p>
                                    <p className="text-sm text-slate-800">{details.address || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t">
                              <p className="text-xs text-slate-500 font-semibold mb-2">📦 Materials Requested:</p>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-slate-800">{materialsText || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            {details.notes && (
                              <div className="pt-3 border-t">
                                <p className="text-xs text-slate-500 font-semibold mb-2">📝 Notes:</p>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                  <p className="text-sm text-slate-800">{details.notes}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl border-2">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  {editingId ? <Edit className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  {editingId ? 'Edit Material' : 'Add New Material'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter material title"
                      className="border-2 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter material description"
                      className="border-2 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="e.g., Cotton, Silk"
                        className="border-2 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-semibold">Price (Rs)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          value={formData.price}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="border-2 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-semibold">Quantity</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={handleChange}
                          min="0"
                          placeholder="0"
                          className="border-2 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageFile" className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          id="imageFile"
                          className="flex-1 border-2 focus:border-blue-500"
                        />
                        {selectedFile && (
                          <Button
                            type="button"
                            onClick={handleImageUpload}
                            disabled={uploadingImage}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {uploadingImage ? 'Uploading...' : 'Upload'}
                          </Button>
                        )}
                      </div>
                      {formData.imageUrl && (
                        <div className="rounded-lg overflow-hidden border-2 border-blue-200">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      {loading ? 'Saving...' : editingId ? 'Update Material' : 'Upload Material'}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={cancelEdit} className="border-2">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Materials Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Materials Inventory
                  <Badge className="ml-2 bg-blue-600">{materials.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {materials.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <Package className="w-20 h-20 mx-auto text-slate-300" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-slate-600">No Materials Yet</h3>
                      <p className="text-slate-500">Start by adding your first material using the form</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {materials.map((material) => (
                      <Card key={material._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
                        <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                          {material.imageUrl && !imageErrors[material._id] ? (
                            <img 
                              src={material.imageUrl} 
                              alt={material.title}
                              className="w-full h-full object-cover"
                              onLoad={(e) => {
                                console.log('✅ Image loaded successfully:', material.imageUrl);
                              }}
                              onError={(e) => {
                                console.error('❌ Image failed to load:', material.imageUrl);
                                setImageErrors(prev => ({...prev, [material._id]: true}));
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                              <ImageIcon className="w-16 h-16 mb-2" />
                              <p className="text-sm font-medium">No Image</p>
                            </div>
                          )}
                          {material.quantity === 0 && (
                            <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <h3 className="text-lg font-bold text-slate-800">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-slate-600 line-clamp-2">{material.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {material.category && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {material.category}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Rs.{material.price}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={material.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                            >
                              {material.quantity} units
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => handleEdit(material)} 
                              variant="outline" 
                              size="sm"
                              className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => handleDelete(material._id)} 
                              variant="destructive"
                              size="sm"
                              className="flex-1 bg-red-500 hover:bg-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
