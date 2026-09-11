import bcrypt from 'bcryptjs';

export interface DataUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  website: string;
  location: string;
  followers: string[];
  following: string[];
  googleId?: string;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataPost {
  _id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  author: string | DataUser;
  tags: string[];
  likes: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataComment {
  _id: string;
  post: string;
  author: string | DataUser;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataLike {
  _id: string;
  post: string;
  user: string;
  createdAt: string;
}

export interface DataNotification {
  _id: string;
  recipient: string;
  sender: string | DataUser;
  type: 'like' | 'comment' | 'follow' | 'system';
  post?: string | DataPost;
  text: string;
  isRead: boolean;
  createdAt: string;
}

class LocalStore {
  public users: DataUser[] = [];
  public posts: DataPost[] = [];
  public comments: DataComment[] = [];
  public likes: DataLike[] = [];
  public notifications: DataNotification[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('Password123!', salt);

    const user1: DataUser = {
      _id: '65f0a1b2c3d4e5f6a7b8c901',
      name: 'Elena Vance',
      username: 'elena_vance',
      email: 'elena@ideverse.io',
      password: demoPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Biomimicry researcher & green architectural designer. Designing carbon-sequestering urban structures.',
      website: 'https://biobuild.earth',
      location: 'Zurich, Switzerland',
      followers: ['65f0a1b2c3d4e5f6a7b8c902'],
      following: ['65f0a1b2c3d4e5f6a7b8c902'],
      notificationsEnabled: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    };

    const user2: DataUser = {
      _id: '65f0a1b2c3d4e5f6a7b8c902',
      name: 'Kaelen Miller',
      username: 'kaelen_ai',
      email: 'kaelen@ideverse.io',
      password: demoPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Autonomous systems engineer exploring transparent AI interfaces and decentralized collaborative memory.',
      website: 'https://kaelen.dev',
      location: 'Seattle, WA',
      followers: ['65f0a1b2c3d4e5f6a7b8c901'],
      following: ['65f0a1b2c3d4e5f6a7b8c901'],
      notificationsEnabled: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    };

    const user3: DataUser = {
      _id: '65f0a1b2c3d4e5f6a7b8c903',
      name: 'Aria Chen',
      username: 'ariachen',
      email: 'aria@ideverse.io',
      password: demoPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      bio: 'Creative coder and generative artist exploring the tactile boundary between physical print and neural renderers.',
      website: 'https://ariachen.art',
      location: 'Tokyo, Japan',
      followers: ['65f0a1b2c3d4e5f6a7b8c901'],
      following: [],
      notificationsEnabled: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    };

    this.users.push(user1, user2, user3);

    const post1: DataPost = {
      _id: '65f0b1b2c3d4e5f6a7b8c911',
      title: 'Algae-Infused Kinetic Facades for Self-Cooling Architecture',
      description: 'What if commercial skyscrapers could breathe and cool themselves without energy-intensive HVAC compressor units?\n\nBy integrating micro-algae photobioreactors into double-skin facade louvers, building skins can dynamically shade interiors based on solar intensity while sequestering ambient CO2 and circulating purified cool air. Here is an architectural schematic diagram of the closed fluidic loop and the structural glass framing tested in our prototype.',
      category: 'Environment',
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop&q=80',
      author: user1._id,
      tags: ['Biomimicry', 'CleanTech', 'Architecture', 'Sustainability'],
      likes: [user2._id, user3._id],
      likesCount: 2,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    };

    const post2: DataPost = {
      _id: '65f0b1b2c3d4e5f6a7b8c912',
      title: 'Contextual Semantic Canvas: Visualizing Collaborative Human-AI Working Memory',
      description: 'Current LLM interfaces trap multi-dimensional discussions inside narrow vertical chat bubbles. Ideas, references, and branch trajectories disappear above the scroll fold.\n\nWe designed an interactive spatial concept where thoughts expand as connected topological nodes. Sub-problems spawn visual satellites, citations stay pinned, and ideas can be merged with drag-and-drop gravitational snapping.',
      category: 'Innovation',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      author: user2._id,
      tags: ['AI', 'HumanComputerInteraction', 'Canvas', 'KnowledgeGraph'],
      likes: [user1._id],
      likesCount: 1,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    };

    const post3: DataPost = {
      _id: '65f0b1b2c3d4e5f6a7b8c913',
      title: 'Procedural Ceramic Glazes: Algorithms Meeting Pottery in Real Clay',
      description: 'Exploring how mathematical differential equations (reaction-diffusion systems and Turing patterns) can be compiled into physical glaze spray recipes.\n\nBy controlling mineral suspension ratios and kiln thermal ramps programmatically, each fired vessel develops natural, non-repeating organic motifs resembling coral reefs and lichen growth on stone.',
      category: 'Art',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&auto=format&fit=crop&q=80',
      author: user3._id,
      tags: ['GenerativeArt', 'Ceramics', 'CraftTech', 'Materials'],
      likes: [user1._id, user2._id],
      likesCount: 2,
      commentsCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    };

    this.posts.push(post1, post2, post3);

    this.likes.push(
      { _id: 'like_1', post: post1._id, user: user2._id, createdAt: new Date().toISOString() },
      { _id: 'like_2', post: post1._id, user: user3._id, createdAt: new Date().toISOString() },
      { _id: 'like_3', post: post2._id, user: user1._id, createdAt: new Date().toISOString() },
      { _id: 'like_4', post: post3._id, user: user1._id, createdAt: new Date().toISOString() },
      { _id: 'like_5', post: post3._id, user: user2._id, createdAt: new Date().toISOString() }
    );

    this.comments.push(
      {
        _id: 'comm_1',
        post: post1._id,
        author: user2._id,
        text: 'The solar tracking calibration on the algae tubes is brilliant! Have you tested winter freeze tolerance for the circulation medium?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      },
      {
        _id: 'comm_2',
        post: post1._id,
        author: user3._id,
        text: 'The translucent green cast this creates inside the building must feel like an undersea canopy. Phenomenal aesthetic work.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
      {
        _id: 'comm_3',
        post: post2._id,
        author: user1._id,
        text: 'This directly solves our team problem of lost context in linear documentation threads. Would love to pilot this on our research notes.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      }
    );

    this.notifications.push(
      {
        _id: 'notif_1',
        recipient: user1._id,
        sender: user2._id,
        type: 'like',
        post: post1._id,
        text: 'liked your idea "Algae-Infused Kinetic Facades"',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
      {
        _id: 'notif_2',
        recipient: user1._id,
        sender: user2._id,
        type: 'comment',
        post: post1._id,
        text: 'commented on your idea "Algae-Infused Kinetic Facades"',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      }
    );
  }

  public populatePostAuthor(post: DataPost): any {
    const authorObj = this.users.find(u => u._id.toString() === (typeof post.author === 'object' ? post.author._id : post.author).toString());
    const safeAuthor = authorObj ? {
      _id: authorObj._id,
      name: authorObj.name,
      username: authorObj.username,
      avatar: authorObj.avatar,
      bio: authorObj.bio,
    } : { _id: 'unknown', name: 'Creator', username: 'creator', avatar: '', bio: '' };

    return {
      ...post,
      author: safeAuthor,
    };
  }

  public populateCommentAuthor(comment: DataComment): any {
    const authorObj = this.users.find(u => u._id.toString() === (typeof comment.author === 'object' ? comment.author._id : comment.author).toString());
    const safeAuthor = authorObj ? {
      _id: authorObj._id,
      name: authorObj.name,
      username: authorObj.username,
      avatar: authorObj.avatar,
    } : { _id: 'unknown', name: 'User', username: 'user', avatar: '' };

    return {
      ...comment,
      author: safeAuthor,
    };
  }
}

export const localStore = new LocalStore();
