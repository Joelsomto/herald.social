import { useState } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  Sparkles,
  BadgeCheck,
  Palette,
  Zap,
  Crown,
  Star,
  Gift,
  Package,
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Gem,
  Rocket,
  Shield
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'httn' | 'espees';
  category: 'nft' | 'tool' | 'subscription' | 'merchandise';
  image: string;
  featured?: boolean;
  badge?: string;
  soldCount?: number;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Gold Creator Badge NFT',
    description: 'Exclusive limited edition NFT badge for verified creators. Shows your status across the platform.',
    price: 5000,
    priceType: 'httn',
    category: 'nft',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&h=300&fit=crop',
    featured: true,
    badge: 'Limited',
    soldCount: 234,
  },
  {
    id: '2',
    name: 'Herald Pro Monthly',
    description: '2x HTTN rewards, priority support, advanced analytics, and early access to features.',
    price: 2500,
    priceType: 'httn',
    category: 'subscription',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=300&fit=crop',
    featured: true,
    badge: 'Popular',
    soldCount: 1250,
  },
  {
    id: '3',
    name: 'Content Scheduler Pro',
    description: 'Advanced scheduling tool with AI-powered best time suggestions and bulk upload.',
    price: 1500,
    priceType: 'httn',
    category: 'tool',
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=300&fit=crop',
    badge: 'New',
    soldCount: 456,
  },
  {
    id: '4',
    name: 'Founding Member NFT',
    description: 'Exclusive NFT for early Herald adopters. Grants special perks and recognition.',
    price: 10000,
    priceType: 'httn',
    category: 'nft',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop',
    badge: 'Rare',
    soldCount: 50,
  },
  {
    id: '5',
    name: 'Analytics Dashboard Pro',
    description: 'Deep insights into your content performance with AI recommendations.',
    price: 2000,
    priceType: 'httn',
    category: 'tool',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=300&fit=crop',
    soldCount: 789,
  },
  {
    id: '6',
    name: 'Herald Hoodie',
    description: 'Premium quality hoodie with Herald branding. Soft cotton blend.',
    price: 15000,
    priceType: 'espees',
    category: 'merchandise',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop',
    soldCount: 167,
  },
  {
    id: '7',
    name: 'Profile Themes Pack',
    description: 'Customize your profile with exclusive themes and color schemes.',
    price: 800,
    priceType: 'httn',
    category: 'tool',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=300&fit=crop',
    badge: 'Hot',
    soldCount: 2341,
  },
  {
    id: '8',
    name: 'Engagement Booster',
    description: 'Get featured in the spotlight section for 24 hours.',
    price: 500,
    priceType: 'httn',
    category: 'tool',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=300&fit=crop',
    soldCount: 890,
  },
];

const categoryIcons = {
  nft: Gem,
  tool: Zap,
  subscription: Crown,
  merchandise: Package,
};

export default function EStore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleCart = (id: string) => {
    setCart(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rightSidebar = (
    <div className="space-y-4">
      {/* Cart Preview */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          ) : (
            <div className="space-y-2">
              {cart.map(id => {
                const product = products.find(p => p.id === id);
                if (!product) return null;
                return (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate flex-1">{product.name}</span>
                    <span className="gold-text font-semibold">{product.price}</span>
                  </div>
                );
              })}
              <Button variant="gold" size="sm" className="w-full mt-2">
                Checkout ({cart.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VerticalAdBanner {...verticalAds[0]} />
    </div>
  );

  const ProductCard = ({ product }: { product: Product }) => {
    const Icon = categoryIcons[product.category];
    return (
      <Card className={`bg-card border-border overflow-hidden transition-all hover:border-primary/50 ${product.featured ? 'ring-1 ring-primary/30' : ''}`}>
        <div className="relative aspect-square bg-secondary">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              {product.badge}
            </Badge>
          )}
          <button
            onClick={() => toggleFavorite(product.id)}
            className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors ${
              favorites.includes(product.id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="w-3 h-3" />
            <span className="capitalize">{product.category}</span>
            {product.soldCount && (
              <>
                <span>•</span>
                <span>{product.soldCount.toLocaleString()} sold</span>
              </>
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display font-bold gold-text">
                {product.price.toLocaleString()} {product.priceType.toUpperCase()}
              </span>
            </div>
            <Button 
              size="sm" 
              variant={cart.includes(product.id) ? 'outline' : 'gold'}
              onClick={() => toggleCart(product.id)}
            >
              {cart.includes(product.id) ? 'Remove' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                E-Store
              </h1>
              <p className="text-sm text-muted-foreground">NFTs, Tools & Creator Resources</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {/* Featured Banner */}
        <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-herald-violet/20 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-foreground">Herald Pro Launch Sale</h2>
                <p className="text-sm text-muted-foreground">Get 50% bonus HTTN on all Pro subscriptions this week!</p>
              </div>
              <Button variant="gold">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Star className="w-4 h-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="nft" className="gap-2">
              <Gem className="w-4 h-4" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="tool" className="gap-2">
              <Zap className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <Crown className="w-4 h-4" />
              Subscriptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nft" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.filter(p => p.category === 'nft').map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tool" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.filter(p => p.category === 'tool').map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.filter(p => p.category === 'subscription').map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span>Verified Items</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gift className="w-4 h-4 text-primary" />
            <span>Instant Delivery</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
