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

  public static Double CalculateSin(String input) throws Exception {
    String sinPart = input.substring(input.indexOf("sin("), input.indexOf(")") + 1);
    String sinPartArgument = sinPart.replace("sin(", "").replace(")", "");
    Double sinPartArgumentDouble = Double.parseDouble(sinPartArgument);
    String multiplierPart = input.substring(0, input.indexOf("*"));
    Double multiplierPartDouble = Double.parseDouble(multiplierPart);
    Double spad = sinPartArgumentDouble;

    double sum = 0.0;
    long factorial = 1;
    double numerator = 1;
    int sign = 1;
    
    for (int i = 0; i < 20; i++) {
      if (i % 2 == 1) {
        sum = sum + sign * (numerator/factorial);
        sign = -1 * sign;
      }
      numerator = numerator * spad;
      factorial = factorial * (long)(i + 1);
    }

    return multiplierPartDouble * sum;
  }
}
