import React, { useState, useEffect } from 'react';
import { ShoppingBagIcon, UsersIcon, TruckIcon, MapPinIcon, ClockIcon, PlusIcon, ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
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
      const response = await api.post('/marketplace/listings/', listingData);
      setShowCreateModal(false);
      setShowInventoryModal(false);
      await fetchData();
      alert('Listing created successfully!');
    } catch (error) {
      console.error('Error creating listing:', error);
      
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
      const response = await api.post('/marketplace/suppliers/', supplierData);
      setShowSupplierModal(false);
      await fetchData();
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
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
      const response = await api.post(`/marketplace/listings/${listingId}/make_offer/`, offerData);
      setShowOfferModal(false);
      alert('Offer submitted successfully!');
    } catch (error) {
      console.error('Error submitting offer:', error);
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
      handleViewOffers(selectedListing);
      await fetchData();
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await api.post(`/marketplace/offers/${offerId}/reject/`);
      alert('Offer rejected');
      handleViewOffers(selectedListing);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Community Marketplace</h1>
            <p className="text-gray-600 mt-1">Connect with local stores and suppliers</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowInventoryModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Sell from Inventory
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Listing
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{listings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Group Buys</p>
              <p className="text-2xl font-semibold text-gray-900">{groupBuys.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Local Suppliers</p>
              <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <MapPinIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{myListings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Browse Listings Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Available</h3>
              <p className="text-gray-600">Be the first to create a listing!</p>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getListingTypeColor(listing.listing_type)}`}>
                    {getListingTypeLabel(listing.listing_type)}
                  </span>
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Delivery Available
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleContactSeller(listing)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Contact Seller
                  </button>
                  <button 
                    onClick={() => handleMakeOffer(listing)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Make Offer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Group Buys Tab */}
      {activeTab === 'group-buys' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupBuys.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Buys Active</h3>
              <p className="text-gray-600">Start a group buy to get better prices!</p>
            </div>
          ) : (
            groupBuys.map((groupBuy) => (
              <div key={groupBuy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {groupBuy.status}
                  </span>
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
                
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  Join Group Buy
                </button>
              </div>
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
            <button 
              onClick={() => setShowSupplierModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Supplier
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Listed</h3>
              <p className="text-gray-600 mb-4">Add local suppliers to build your network!</p>
              <button 
                onClick={() => setShowSupplierModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Supplier
              </button>
            </div>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.supplier_type}</p>
                  </div>
                  {supplier.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
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
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product}
                      </span>
                    ))}
                    {supplier.products_list?.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{supplier.products_list.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(supplier.rating) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      ({supplier.total_reviews})
                    </span>
                  </div>
                  <button 
                    onClick={() => handleContactSupplier(supplier)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Messages</h3>
          <p className="text-gray-600 mb-4">Direct communication with buyers and sellers</p>
          <p className="text-sm text-gray-500">Messages are created automatically when offers are accepted</p>
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h3>
              <p className="text-gray-600 mb-4">Create your first listing to start trading!</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Listing
              </button>
            </div>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getListingTypeColor(listing.listing_type)}`}>
                        {getListingTypeLabel(listing.listing_type)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.status}
                      </span>
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
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleViewOffers(listing)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Offers
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
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