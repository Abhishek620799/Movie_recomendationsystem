package MOvierecomedation.movierecomedation;

import jakarta.annotation.PostConstruct;
import org.springframework.ai.embedding.EmbeddingModel;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class MovieService {

    private final JsonMapper jsonMapper;
    private final EmbeddingModel embeddingModel;

    private  final List<Movie> moviesEmbedding = new ArrayList<>();

    public MovieService(JsonMapper jsonMapper, EmbeddingModel embeddingModel) {
        this.jsonMapper = jsonMapper;
        this.embeddingModel = embeddingModel;
    }
    @PostConstruct
    public void  intilialzeMovies()throws IOException{
        ClassPathResource resource =  new ClassPathResource("Movies.json");
        InputStream inputStream = resource.getInputStream();
        List<Moviedata> moviedataList = jsonMapper.readValue(
                inputStream,
                new tools.jackson.core.type.TypeReference<List<Moviedata>>() {
                    @Override
                    public int compareTo(tools.jackson.core.type.TypeReference<List<Moviedata>> o) {
                        return super.compareTo(o);
                    }
                }
        );
        for(Moviedata moviedata : moviedataList){
            float [] embedding = embeddingModel.embed(moviedata.getDescription());
            Movie movie = new Movie(
                    moviedata.getDescription(),
                    moviedata.getTitle(),
                    embedding
            );
            moviesEmbedding.add(movie);
        }
        inputStream.close();


    }


    public  List<MovieMatch> Search(String query){
  float[] userQueryEmbedding =     embeddingModel.embed(query);
      List<MovieMatch>matches = new ArrayList<>();
      for(Movie movie : moviesEmbedding){
          double similarity = cosinesimilarity(userQueryEmbedding ,movie.getEmbedding());
          MovieMatch match = new MovieMatch(movie.getTitle(), movie.getDescription(),similarity);
          matches.add(match);
      }
        SortBySimilarity(matches);
      return  topKMatches(matches,3);
    }
    private double cosinesimilarity(float[]a,float[]b){
        double dotproduct = 0.0;
        double normA =0.0;
        double normB= 0.0;
        for(int i=0; i<a.length; i++){
            dotproduct+=(a[i]*b[i]);
            normA +=(a[i]*a[i]);
            normB +=(b[i]*b[i]);

        }
        if(normA == 0 || normB== 0){
            return  0.0;
        }
        return dotproduct/(Math.sqrt(normA)*Math.sqrt(normB));


    }
    private  void SortBySimilarity(List<MovieMatch>matches){
        Collections.sort(matches ,(first,second)->Double.compare(
                second.getMatch(),
                first.getMatch()
        ));
    }
 private List<MovieMatch>topKMatches(List<MovieMatch>matches,int limit){
        List<MovieMatch>topMatches = new ArrayList<>();
        int numberofMatches = Math.min(limit,matches.size());
        for(int i=0; i<numberofMatches; i++){
            topMatches.add(matches.get(i));
        }
        return  topMatches;
 }
 public  List<MovieMatch> similarMovies(String title){
     Movie selectedMovies = findMovies(title);
     List<MovieMatch>matches = new ArrayList<>();
     for(Movie movie : moviesEmbedding) {
         if (movie.getTitle().equalsIgnoreCase(title)) {
             continue;
         }


         double similarity = cosinesimilarity(selectedMovies.getEmbedding(), movie.getEmbedding());
         MovieMatch match = new MovieMatch(movie.getTitle(), movie.getDescription(), similarity);
         matches.add(match);
     }

     SortBySimilarity(matches);
     return topKMatches(matches,3);
 }
 private Movie findMovies(String title){
        for(Movie movie : moviesEmbedding){
            if(movie.getTitle().equalsIgnoreCase(title)){
                return movie;
            }
        }
        throw new IllegalArgumentException(
                "Movie not found"+title
        );
 }






}
