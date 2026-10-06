package MOvierecomedation.movierecomedation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/movies")
public class MovieController {
    @Autowired
    private  MovieService movieService;
    @GetMapping("/search")
    public List<MovieMatch> Search(@RequestParam String query){
     return     movieService.Search(query);

    }
    @GetMapping("/title/similarity")
    public List<MovieMatch>search (@RequestParam String query){
        return movieService.similarMovies(query);
    }



}
