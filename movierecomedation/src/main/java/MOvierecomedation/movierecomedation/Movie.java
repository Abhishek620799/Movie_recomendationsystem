package MOvierecomedation.movierecomedation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Movie {
    private  String title;
    private String description;
    private  float[] embedding;

}
