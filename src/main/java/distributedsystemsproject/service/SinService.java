package distributedsystemsproject.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.stereotype.Service;

@Service
public class SinService {

  public static byte[] getSin(String command, String session) throws Exception {
    Runtime commandPrompt = Runtime.getRuntime();
    
    String[] commandArray = {"/usr/local/bin/gnuplot",
      "-e",
      "set terminal png size 400,300; set output \'" + session + ".png\'; plot [-3.14:3.14] " + command
    };
    
    Process p = commandPrompt.exec(commandArray);
    BufferedReader stdError = new BufferedReader(new InputStreamReader(p.getErrorStream()));
    
    String s = null;
    while ((s = stdError.readLine()) != null) {
      System.out.println(s);
    }
    p.waitFor();

    Path path = Paths.get(session + ".png");
    byte[] data = Files.readAllBytes(path);

    Files.deleteIfExists(path);

    return data;
  }
}
