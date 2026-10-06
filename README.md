Today 11:38 AM
Pasted markdown.md


Movie Recommendation System built using Java Spring Boot, text embeddings, vector representations, and cosine similarity to recommend movies based on their descriptions. The project demonstrates how vector similarity and vector databases can be used to build recommendation systems similar to the core concepts used by platforms like Netflix and YouTube.

Short GitHub description:

🎬 Movie Recommendation System using Embeddings, Cosine Similarity & Vector Database | Java Spring Boot

Topics:
Java Spring Boot Machine Learning Embeddings Vector Database Cosine Similarity Recommendation System NLP

Pasted markdown(1).md
File

e lo deko mai mere url se keuu nhi match kr rha hai
import java.util.List;

@RestController
@CrossOrigin(origins = {
"http://127.0.0.1:4173",
"http://localhost:4173"
})
@RequestMapping("/movies")
public class MovieController {
@Autowired
private MovieService movieService;
@GetMapping("/search")
public List<MovieMatch> Search(@RequestParam String query){
return movieService.Search(query);

}

@GetMapping("/title/similarity")
public List<MovieMatch>search (@RequestParam String query){
return movieService.similarMovies(query);
}

Haan, maine tumhari frontend JS file dekhi. Tumhare backend URL aur frontend URL ka main issue MOVIE_API_BASE_URL hai. Tumhari JS mein request yahan ban rahi hai:

const baseUrl = String(window.MOVIE_API_BASE_URL || '').replace(/\/+$/, '');

const response = await fetch(
    `${baseUrl}/movies/${endpoint}?${encodedQuery}`
);

Tumhare backend ke endpoints actually ye hain:

GET /movies/search?query=Inception

GET /movies/title/similarity?query=Inception
Agar Spring Boot localhost:8080 par chal raha hai

Frontend JS mein simply ye karo:

const BASE_URL = "http://localhost:8080";

async function requestMovies(endpoint, query) {
    const encodedQuery = new URLSearchParams({ query }).toString();

    const response = await fetch(
        `${BASE_URL}/movies/${endpoint}?${encodedQuery}`
    );

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
}

Tumhare existing code mein ye line:

const baseUrl = String(window.MOVIE_API_BASE_URL || '').replace(/\/+$/, '');

ko replace kar do:

const baseUrl = "http://localhost:8080";
Tumhare dono buttons ka URL phir exactly ye banega

Search:

http://localhost:8080/movies/search?query=Inception

Similar Movies:

http://localhost:8080/movies/title/similarity?query=Inception

Tumhari frontend file bhi internally /movies/search aur /movies/title/similarity ko call kar rahi hai.

⚠️ CORS bhi change karna hai

Agar frontend:

http://127.0.0.1:4173

ya

http://localhost:4173

par chal raha hai, tumhara backend:

@CrossOrigin(origins = {
    "http://127.0.0.1:4173",
    "http://localhost:4173"
})

sahi hai.

Lekin agar frontend kisi deployed URL/GitHub Pages/Vercel/Netlify URL par hai, to ye URLs allowed nahi honge.

Testing ke liye temporarily:

@CrossOrigin(origins = "*")

kar sakte ho.

Ek aur important point

Agar frontend ko Spring Boot ke andar rakh rahe ho:

src/main/resources/static/
    index.html
    style.css
    script.js

to localhost:8080 se hi frontend open karo:

http://localhost:8080

Aur JS mein:

const baseUrl = "";

rakho.

Phir request automatically:

http://localhost:8080/movies/search?query=Inception

ban jayegi.

Agar tum mujhe apna actual frontend URL (jo browser ke address bar mein hai) + Spring Boot ka URL bhej do, main exact bata dunga ki mismatch kahan hai.

# Movie_recomendationsystem
Learn vector databases and  how to  find cosine similaritye between two vector array and many more thing its work like netflix or youtube recomendation system
1. Vector kya hota hai
        ↓
2. Dot Product
        ↓
3. Cosine Similarity
        ↓
4. TF-IDF / CountVectorizer
        ↓
5. Text Embeddings
        ↓
6. Sentence Transformers
        ↓
7. Top-K Similarity Search
        ↓
8. Vector Database
        ↓
9. FAISS / Qdrant / pgvector
        ↓
10. Content-Based Recommendation
        ↓
11. User Embeddings
        ↓
12. Collaborative Filtering
        ↓
13. Hybrid Recommendation
        ↓
14. Ranking
        ↓
15. Netflix/YouTube-style architecture
 ek redmi file bann do

Haan, README.md file bana di hai GitHub ke liye.

Download README.md 

README.md
Document
