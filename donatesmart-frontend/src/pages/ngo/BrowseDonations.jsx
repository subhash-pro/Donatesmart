import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDonations } from '../../services/donationService'
import { createRequest } from '../../services/requestService'
import { ArrowLeft, MapPin, Clock, Search, Filter, Send, CheckCircle } from 'lucide-react'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Badge from '../../components/Badge'

const categories = [
    { id: '', label: 'All' },
    { id: 'food', label: '🍎 Food' },
    { id: 'clothing', label: '👕 Clothing' },
    { id: 'books', label: '📚 Books' },
    { id: 'electronics', label: '💻 Electronics' },
    { id: 'educational_materials', label: '🎓 Education' },
    { id: 'household', label: '🏠 Household' },
]

const catIcons = { food: '🍎', clothing: '👕', books: '📚', electronics: '💻', educational_materials: '🎓', household: '🏠' }

const condLabels = {
       new: { label: 'New', variant: 'green' },
    like_new: { label: 'Like New', variant: 'blue' },
    good: { label: 'Good', variant: 'yellow' },
    fair: { label: 'Fair', variant: 'red' },
}

function BrowseDonations() {
    const navigate = useNavigate()
    const [donations, setDonations] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [searchCity, setSearchCity] = useState('')
    const [requestingId, setRequestingId] = useState(null)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [requestedIds, setRequestedIds] = useState(new Set())

    useEffect(() => { fetchDonations() }, [selectedCategory, searchCity])

    const fetchDonations = async () => {
        setLoading(true)
        try {
            const params = []
            if (selectedCategory) params.push(`category=${selectedCategory}`)
            if (searchCity) params.push(`city=${searchCity}`)
            const url = params.length ? '?' + params.join('&') : '/donations'
            const res = await getAllDonations(url)
            setDonations(res.data.data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const handleRequest = async (donationId) => {
        setError(''); setSuccess('')
        if (!message.trim()) { setError('Please add a message to the donor'); return }
        setRequestingId(donationId)
        try {
            await createRequest({ donationId, message })
            setRequestedIds(prev => new Set([...prev, donationId]))
            setSuccess('Request sent successfully!')
            setMessage('')
        } catch (err) { setError(err.response?.data?.message || 'Failed to send request') }
        finally { setRequestingId(null) }
    }

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const fmtCat = (c) => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    return (
        <div className="min-h-screen bg-dark-900">
            {/* Header */}
            <div className="border-b border-white/[0.05] px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/dashboard')} icon={ArrowLeft} className="text-xs px-3 py-2">Back</Button>
                <h1 className="text-lg font-semibold text-white">Browse Donations</h1>
            </div>

            {/* Filters */}
            <div className="px-6 py-5 border-b border-white/[0.05]">
                <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <input
                            value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
                            placeholder="Search by city..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-neutral-200 outline-none focus:border-brand transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs px-2">
                        <Filter className="w-3.5 h-3.5" /> Filter
                    </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none transition-all duration-200
                            ${selectedCategory === cat.id ? 'bg-brand/10 text-brand border border-brand/30' : 'bg-white/[0.03] text-neutral-500 border border-transparent hover:text-neutral-300'}`}>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="px-6">
                {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-4 text-sm text-red-400">{error}</div>}
                {success && <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 mt-4 text-sm text-brand flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {success}</div>}
            </div>

            {/* Donations List */}
            <div className="px-6 py-5 max-w-3xl mx-auto">
                {loading ? (
                    <div className="text-center py-16 text-neutral-500 text-sm">Loading donations...</div>
                ) : donations.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-neutral-500 text-sm">No donations found</p>
                        <p className="text-neutral-600 text-xs mt-1">Try changing filters or search terms</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {donations.map((d) => {
                            const isRequested = requestedIds.has(d._id)
                            const cond = condLabels[d.condition] || condLabels.good

                            return (
                                <Card key={d._id} padding="p-5" hover>
                                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{catIcons[d.category] || '📦'}</span>
                                            <div>
                                                <div className="text-[15px] font-medium text-white mb-1">{d.title}</div>
                                                <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 flex-wrap">
                                                    <Badge>{fmtCat(d.category)}</Badge>
                                                    <Badge variant={cond.variant}>{cond.label}</Badge>
                                                    <span>{d.quantity} item{d.quantity > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isRequested && (
                                            <Badge variant="brand" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Requested</Badge>
                                        )}
                                    </div>

                                    {d.description && <p className="text-[13px] text-neutral-400 mb-3 leading-relaxed">{d.description}</p>}

                                    <div className="flex items-center gap-4 text-[11px] text-neutral-500 mb-4 flex-wrap">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.pickupLocation.address}, {d.pickupLocation.city} {d.pickupLocation.postcode}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(d.createdAt)}</span>
                                        {d.donorId && <span>by {d.donorId.firstName} {d.donorId.lastName}</span>}
                                    </div>

                                    {!isRequested && (
                                        <div className="border-t border-white/[0.04] pt-4">
                                            <textarea
                                                value={message} onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Add a message for the donor (why you need this, pickup availability, etc.)"
                                                rows={2}
                                                className="w-full p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-neutral-200 outline-none focus:border-brand transition-colors resize-vertical font-sans mb-3"
                                            />
                                            <Button onClick={() => handleRequest(d._id)} disabled={requestingId === d._id} icon={Send} className="text-xs px-5 py-2 float-right">
                                                {requestingId === d._id ? 'Sending...' : 'Send Request'}
                                            </Button>
                                            <div className="clear-both" />
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default BrowseDonations