import React, { useState, useEffect } from 'react';
import { ShoppingBagIcon, UsersIcon, TruckIcon, MapPinIcon, ClockIcon, PlusIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import CreateListingModal from '../components/CreateListingModal';
import AddSupplierModal from '../components/AddSupplierModal';
import ContactSupplierModal from '../components/ContactSupplierModal';
import SellFromInventoryModal from '../components/SellFromInventoryModal';
import MakeOfferModal from '../components/MakeOfferModal';
import ContactSellerModal from '../components/ContactSellerModal';
import OffersModal from '../components/OffersModal';

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [groupBuys, setGroupBuys] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showContactSellerModal, setShowContactSellerModal] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showOffersModal, setShowOffersModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listingsRes, groupBuysRes, suppliersRes, myListingsRes] = await Promise.all([
        api.get('/marketplace/listings/'),
        api.get('/marketplace/group-buys/'),
        api.get('/marketplace/suppliers/'),
        api.get('/marketplace/listings/my_listings/')
      ]);
      
      setListings(Array.isArray(listingsRes.data) ? listingsRes.data : listingsRes.data?.results || []);
      setGroupBuys(Array.isArray(groupBuysRes.data) ? groupBuysRes.data : groupBuysRes.data?.results || []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : suppliersRes.data?.results || []);
      setMyListings(Array.isArray(myListingsRes.data) ? myListingsRes.data : myListingsRes.data?.results || []);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      console.error('Error details:', error.response);
      setListings([]);
      setGroupBuys([]);
      setSuppliers([]);
      setMyListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (listingData) => {
    try {
      setSubmitting(true);
      console.log('Creating listing with data:', listingData);
      const response = await api.post('/marketplace/listings/', listingData);
      console.log('Listing created successfully:', response.data);
      setShowCreateModal(false);
      setShowInventoryModal(false);
      await fetchData();
      alert('Listing created successfully!');
    } catch (error) {
      console.error('Error creating listing:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to create listing.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          const errors = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = errors || 'Validation failed';
        }
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSupplier = async (supplierData) => {
    try {
      setSubmitting(true);
      console.log('Adding supplier:', supplierData);
      const response = await api.post('/marketplace/suppliers/', supplierData);
      console.log('Supplier added successfully:', response.data);
      setShowSupplierModal(false);
      await fetchData(); // Wait for data refresh
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to add supplier: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowContactModal(true);
  };

  const handleMakeOffer = (listing) => {
    setSelectedListing(listing);
    setShowOfferModal(true);
  };

  const handleContactSeller = (listing) => {
    setSelectedListing(listing);
    setShowContactSellerModal(true);
  };

  const handleSubmitOffer = async (listingId, offerData) => {
    try {
      setSubmitting(true);
      console.log('Submitting offer:', offerData);
      const response = await api.post(`/marketplace/listings/${listingId}/make_offer/`, offerData);
      setShowOfferModal(false);
      alert('Offer submitted successfully!');
    } catch (error) {
      console.error('Error submitting offer:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to submit offer: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewOffers = async (listing) => {
    try {
      const response = await api.get('/marketplace/offers/');
      const listingOffers = (response.data?.results || response.data || []).filter(
        offer => offer.listing === listing.id
      );
      setOffers(listingOffers);
      setSelectedListing(listing);
      setShowOffersModal(true);
    } catch (error) {
      console.error('Error fetching offers:', error);
      alert('Failed to load offers');
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const response = await api.post(`/marketplace/offers/${offerId}/accept/`);
      const { buyer_contact, buyer_name, delivery_needed } = response.data;
      
      let message = `Offer accepted! ${buyer_name} has been notified.`;
      if (buyer_contact && buyer_contact !== 'Contact via app messages') {
        message += `\n\nBuyer contact: ${buyer_contact}`;
      }
      if (delivery_needed) {
        message += '\n\nDelivery is required for this order.';
      }
      message += '\n\nA message thread has been created in the Messages tab for coordination.';
      
      alert(message);
      handleViewOffers(selectedListing); // Refresh offers
      await fetchData(); // Refresh all data to update listing quantities
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await api.post(`/marketplace/offers/${offerId}/reject/`);
      alert('Offer rejected');
      handleViewOffers(selectedListing); // Refresh offers
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer');
    }
  };

  const getListingTypeColor = (type) => {
    switch (type) {
      case 'sell': return 'bg-green-100 text-green-800';
      case 'buy': return 'bg-blue-100 text-blue-800';
      case 'group_buy': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getListingTypeLabel = (type) => {
    switch (type) {
      case 'sell': return 'Selling';
      case 'buy': return 'Buying';
      case 'group_buy': return 'Group Buy';
      case 'emergency': return 'Emergency';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Community Marketplace</h1>
          <p className="text-gray-600">Connect with local stores and suppliers</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowInventoryModal(true)} variant="outline" className="flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>Sell from Inventory</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>Create Listing</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{listings.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Group Buys</p>
              <p className="text-2xl font-semibold text-gray-900">{groupBuys.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Local Suppliers</p>
              <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">My Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{myListings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'browse', name: 'Browse Listings', count: listings.length },
            { id: 'group-buys', name: 'Group Buys', count: groupBuys.length },
            { id: 'suppliers', name: 'Local Suppliers', count: suppliers.length },
            { id: 'messages', name: 'Messages', count: 0 },
            { id: 'my-listings', name: 'My Listings', count: myListings.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <Badge className="ml-2">{tab.count}</Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Browse Listings Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Available</h3>
              <p className="text-gray-600">Be the first to create a listing!</p>
            </div>
          ) : (
            listings.map((listing) => (
              <Card key={listing.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={getListingTypeColor(listing.listing_type)}>
                    {getListingTypeLabel(listing.listing_type)}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {listing.time_left}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.title}</h3>
                <p className="text-gray-600 mb-3">{listing.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product:</span>
                    <span className="text-sm font-medium">{listing.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="text-sm font-medium">{listing.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-medium">₦{listing.unit_price}/unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Value:</span>
                    <span className="text-sm font-semibold text-green-600">₦{listing.total_value.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {listing.location}
                  </div>
                  {listing.delivery_available && (
                    <Badge className="bg-blue-100 text-blue-800">Delivery Available</Badge>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleContactSeller(listing)}
                  >
                    Contact Seller
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleMakeOffer(listing)}
                  >
                    Make Offer
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Group Buys Tab */}
      {activeTab === 'group-buys' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupBuys.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Buys Active</h3>
              <p className="text-gray-600">Start a group buy to get better prices!</p>
            </div>
          ) : (
            groupBuys.map((groupBuy) => (
              <Card key={groupBuy.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-purple-100 text-purple-800">{groupBuy.status}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(groupBuy.deadline).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{groupBuy.product_name}</h3>
                <p className="text-gray-600 mb-4">{groupBuy.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Target Quantity:</span>
                    <span className="text-sm font-medium">{groupBuy.target_quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current:</span>
                    <span className="text-sm font-medium">{groupBuy.current_quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Participants:</span>
                    <span className="text-sm font-medium">{groupBuy.current_participants}/{groupBuy.minimum_participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Target Price:</span>
                    <span className="text-sm font-semibold text-green-600">₦{groupBuy.target_price}/unit</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(groupBuy.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, groupBuy.progress_percentage)}%` }}
                    ></div>
                  </div>
                </div>
                
                <Button className="w-full">Join Group Buy</Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Local Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Local Suppliers</h2>
              <p className="text-sm text-gray-600">Connect with farmers, producers, and wholesalers</p>
            </div>
            <Button onClick={() => setShowSupplierModal(true)} className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add Supplier</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Listed</h3>
              <p className="text-gray-600 mb-4">Add local suppliers to build your network!</p>
              <Button onClick={() => setShowSupplierModal(true)}>Add First Supplier</Button>
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Card key={supplier.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.supplier_type}</p>
                  </div>
                  {supplier.is_verified && (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {supplier.location}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Contact:</strong> {supplier.contact_person}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Phone:</strong> {supplier.phone}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Min Order:</strong> ₦{supplier.minimum_order.toLocaleString()}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Products Offered:</p>
                  <div className="flex flex-wrap gap-1">
                    {supplier.products_list?.slice(0, 3).map((product, index) => (
                      <Badge key={index} className="bg-gray-100 text-gray-800 text-xs">
                        {product}
                      </Badge>
                    ))}
                    {supplier.products_list?.length > 3 && (
                      <Badge className="bg-gray-100 text-gray-800 text-xs">
                        +{supplier.products_list.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(supplier.rating))}
                      {'☆'.repeat(5 - Math.floor(supplier.rating))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      ({supplier.total_reviews})
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleContactSupplier(supplier)}>Contact</Button>
                </div>
              </Card>
            ))
          )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <Card className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Messages</h3>
            <p className="text-gray-600 mb-4">Direct communication with buyers and sellers</p>
            <p className="text-sm text-gray-500">Messages are created automatically when offers are accepted</p>
          </Card>
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <Card className="text-center py-12">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h3>
              <p className="text-gray-600 mb-4">Create your first listing to start trading!</p>
              <Button onClick={() => setShowCreateModal(true)}>Create Listing</Button>
            </Card>
          ) : (
            myListings.map((listing) => (
              <Card key={listing.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                      <Badge className={getListingTypeColor(listing.listing_type)}>
                        {getListingTypeLabel(listing.listing_type)}
                      </Badge>
                      <Badge className={listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{listing.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{listing.quantity} units</span>
                      <span>₦{listing.unit_price}/unit</span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {listing.time_left}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewOffers(listing)}
                    >
                      View Offers
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateListing}
      />
      
      <AddSupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSubmit={handleAddSupplier}
      />
      
      <ContactSupplierModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        supplier={selectedSupplier}
      />
      
      <SellFromInventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        onSubmit={handleCreateListing}
      />
      
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        listing={selectedListing}
        onSubmit={handleSubmitOffer}
      />
      
      <ContactSellerModal
        isOpen={showContactSellerModal}
        onClose={() => setShowContactSellerModal(false)}
        listing={selectedListing}
      />
      
      <OffersModal
        isOpen={showOffersModal}
        onClose={() => setShowOffersModal(false)}
        listing={selectedListing}
        offers={offers}
        onAccept={handleAcceptOffer}
        onReject={handleRejectOffer}
      />
    </div>
  );
};

export default Marketplace;