package distributedsystemsproject.controller;

import distributedsystemsproject.service.SinService;
import java.util.Base64;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Controller
@RequestMapping("/sin")
public class SinController {

  @RequestMapping(method = RequestMethod.GET)
  public ResponseEntity<byte[]> Image(@RequestParam String command) {
    byte[] plot = null;
    ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
    try {
      plot = SinService.getSin(command, attr.getSessionId());
    } catch (Exception e) {
      System.out.print(e.toString());
    }
    if (plot != null) {
      byte[] base64array = Base64.getEncoder().encode(plot);
      return createResponseEntity("image/png", new Long(base64array.length), base64array);
    }
    return null;
  }

  private ResponseEntity<byte[]> createResponseEntity(String contentType, Long contentLength, byte[] content) {
    final HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType(contentType));
    headers.setContentLength(contentLength);
    headers.setCacheControl("public");
    headers.setExpires(Long.MAX_VALUE);
    return new ResponseEntity<>(content, headers, HttpStatus.CREATED);
  }

}
